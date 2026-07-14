import { test, expect, describe } from "vitest";
import { AppError } from "./AppError";

describe("AppError", () => {
  test("carries the statusCode and message it was constructed with", () => {
    const err = new AppError(404, "NotFound");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("NotFound");
  });

  test("is an instance of Error and AppError", () => {
    const err = new AppError(500, "boom");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
