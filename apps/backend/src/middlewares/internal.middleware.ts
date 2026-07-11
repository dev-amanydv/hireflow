import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const internalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const expected = process.env.AGENT_INTERNAL_SECRET;
  const provided = req.header("x-internal-secret");
  if (!expected || provided !== expected) throw new AppError(401, "Unauthorised");
  next();
};
