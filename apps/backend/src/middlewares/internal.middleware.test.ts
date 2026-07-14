import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { internalAuth } from "./internal.middleware";
import { AppError } from "../utils/AppError";
import type { Request, Response, NextFunction } from "express";

function fakeReq(headerValue: string | undefined): Request {
  return {
    header: (name: string) => (name === "x-internal-secret" ? headerValue : undefined),
  } as unknown as Request;
}

describe("internalAuth", () => {
  const ORIGINAL_ENV = process.env.AGENT_INTERNAL_SECRET;

  beforeEach(() => {
    process.env.AGENT_INTERNAL_SECRET = "super-secret";
  });

  afterEach(() => {
    process.env.AGENT_INTERNAL_SECRET = ORIGINAL_ENV;
  });

  test("matching secret header -> calls next() with no error", () => {
    const next = vi.fn() as NextFunction;
    internalAuth(fakeReq("super-secret"), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  test("missing header -> throws 401 AppError", () => {
    const next = vi.fn() as NextFunction;
    expect(() => internalAuth(fakeReq(undefined), {} as Response, next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  test("wrong header value -> throws 401 AppError", () => {
    const next = vi.fn() as NextFunction;
    try {
      internalAuth(fakeReq("wrong-secret"), {} as Response, next);
      throw new Error("expected internalAuth to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  test("AGENT_INTERNAL_SECRET unset -> always rejects, even with a matching-looking header", () => {
    delete process.env.AGENT_INTERNAL_SECRET;
    const next = vi.fn() as NextFunction;
    expect(() => internalAuth(fakeReq("undefined"), {} as Response, next)).toThrow(AppError);
  });
});
