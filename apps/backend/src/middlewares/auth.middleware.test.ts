import { test, expect, describe, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./auth.middleware";
import { JWT_SECRET } from "../utils/utils";
import { AppError } from "../utils/AppError";
import type { Request, Response, NextFunction } from "express";

function fakeReq(token: string | undefined): Request {
  return { cookies: token === undefined ? {} : { access_token: token } } as unknown as Request;
}

function fakeRes() {
  return { json: vi.fn() } as unknown as Response;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  test("no access_token cookie -> throws 401 AppError, next not called", () => {
    const next = vi.fn() as NextFunction;
    const res = fakeRes();
    expect(() => authMiddleware(fakeReq(undefined), res, next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  test("valid token -> sets req.userId and calls next()", () => {
    const token = jwt.sign({ userId: "user-1", email: "a@b.com" }, JWT_SECRET, {
      audience: "User",
      issuer: "quick-hire",
      expiresIn: "2h",
    });
    const req = fakeReq(token);
    const next = vi.fn() as NextFunction;
    authMiddleware(req, fakeRes(), next);

    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalledWith();
  });

  test("expired token -> throws 401 TokenExpired, next not called", () => {
    const token = jwt.sign({ userId: "user-1", email: "a@b.com" }, JWT_SECRET, {
      expiresIn: -10,
    });
    const req = fakeReq(token);
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    expect(() => authMiddleware(req, res, next)).toThrow(
      expect.objectContaining({ statusCode: 401, message: "TokenExpired" }),
    );
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("malformed/invalid-signature token -> throws 401 InvalidToken", () => {
    const wrongToken = jwt.sign({ userId: "user-1" }, "some-other-secret");
    const req = fakeReq(wrongToken);
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    expect(() => authMiddleware(req, res, next)).toThrow(
      expect.objectContaining({ statusCode: 401, message: "InvalidToken" }),
    );
    expect(res.json).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("garbage token string -> throws 401 InvalidToken", () => {
    const req = fakeReq("not-a-jwt-at-all");
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    expect(() => authMiddleware(req, res, next)).toThrow(
      expect.objectContaining({ statusCode: 401, message: "InvalidToken" }),
    );
  });
});
