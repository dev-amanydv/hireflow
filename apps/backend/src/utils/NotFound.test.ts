import { test, expect, describe, vi } from "vitest";
import { NotFound } from "./NotFound";
import { AppError } from "./AppError";
import type { Request, Response } from "express";

describe("NotFound", () => {
  test("calls next with a 404 AppError carrying the original URL", () => {
    const req = { originalUrl: "/api/v1/does-not-exist" } as Request;
    const res = {} as Response;
    const next = vi.fn();

    NotFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Route /api/v1/does-not-exist not found");
  });
});
