import { test, expect, describe, vi, beforeEach } from "vitest";
import { errorHandler } from "./error.middleware";
import { AppError } from "../utils/AppError";
import type { Request, Response, NextFunction } from "express";

function fakeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  (res.status as any).mockReturnValue(res);
  return res;
}

function fakeReq(): Request {
  return { method: "GET", originalUrl: "/api/v1/whatever" } as Request;
}

describe("errorHandler", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("AppError -> uses its statusCode and message", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    errorHandler(new AppError(404, "ResumeNotFound"), fakeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "ResumeNotFound",
      data: null,
    });
  });

  test("JsonWebTokenError -> statusCode is correctly 401", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    const err = Object.assign(new Error("jwt malformed"), { name: "JsonWebTokenError" });
    errorHandler(err, fakeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // BUG: error.middleware.ts chains `if (AppError) {} if (JsonWebTokenError) {} if
  // (TokenExpiredError) {} else {}` — these are sibling `if`s, not `else if`. The
  // `else` is only attached to the TokenExpiredError check, so it fires whenever the
  // error is NOT a TokenExpiredError — including the JsonWebTokenError branch right
  // above it — and overwrites the friendly "Invalid token" message with the raw
  // `err.message` (e.g. "jwt malformed"). statusCode stays correct; only the message
  // is wrong. Fix: make these `else if` (or return early per branch). Documented here
  // via test.fails so it shows up as a known-bug marker rather than a silent pass.
  test.fails("JsonWebTokenError -> message should be the friendly 'Invalid token' (currently clobbered)", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    const err = Object.assign(new Error("jwt malformed"), { name: "JsonWebTokenError" });
    errorHandler(err, fakeReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token",
      data: null,
    });
  });

  test("TokenExpiredError -> 401 TokenExpiredError", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    const err = Object.assign(new Error("jwt expired"), { name: "TokenExpiredError" });
    errorHandler(err, fakeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "TokenExpiredError",
      data: null,
    });
  });

  test("generic Error -> 500 with the error's own message", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    errorHandler(new Error("something broke"), fakeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "something broke",
      data: null,
    });
  });

  test("null error -> 500 Internal Server Error", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    errorHandler(null, fakeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  });

  test("error with empty message -> falls back to default Internal Server Error text", () => {
    const res = fakeRes();
    const next = vi.fn() as NextFunction;
    errorHandler(new Error(""), fakeReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  });
});
