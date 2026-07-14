import { test, expect, describe, vi } from "vitest";
import { AsyncHandler } from "./AsyncHandler";
import type { Request, Response } from "express";

function fakeReqRes() {
  const req = {} as Request;
  const res = {} as Response;
  const next = vi.fn();
  return { req, res, next };
}

describe("AsyncHandler", () => {
  test("resolved handler runs without calling next", async () => {
    const { req, res, next } = fakeReqRes();
    const handler = vi.fn().mockResolvedValue(undefined);
    await AsyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejected promise from an async handler is forwarded to next", async () => {
    const { req, res, next } = fakeReqRes();
    const err = new Error("boom");
    const handler = vi.fn().mockRejectedValue(err);

    AsyncHandler(handler)(req, res, next);
    // let the microtask queue flush the rejection -> next(err)
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(next).toHaveBeenCalledWith(err);
  });

  test("a synchronous throw inside the handler is also forwarded to next", async () => {
    const { req, res, next } = fakeReqRes();
    const err = new Error("sync boom");
    const handler = vi.fn(async () => {
      throw err;
    });

    AsyncHandler(handler)(req, res, next);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(next).toHaveBeenCalledWith(err);
  });
});
