import type { NextFunction, Request, Response } from "express";
import jwt, { type Jwt, type VerifyErrors } from 'jsonwebtoken';
import { JWT_SECRET } from "../utils/utils";
import { success } from "zod";
import { AppError } from "../utils/AppError";

interface JwtPayload {
    userId: string,
    email: string
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.cookies)
    const token = req.cookies.access_token;
    if (!token) throw new AppError(401, 'InvalidToken') ;
    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'TokenExpiredError') {
            throw new AppError(401, 'TokenExpired');
        }
        if (err instanceof Error && err.name === 'JsonWebTokenError') {
            throw new AppError(401, 'InvalidToken');
        }
        throw new AppError(401, 'AuthenticationFailed');
    }

    console.log(decoded);
    req.userId = decoded.userId
    next()
}

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.access_token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            req.userId = decoded.userId;
        } catch {
        }
    }
    next()
}