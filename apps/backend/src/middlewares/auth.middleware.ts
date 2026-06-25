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
        console.log(err)
        if (err instanceof Error && err.name === 'TokenExpiredError') {
            return res.json({
                success: false,
                message: 'TokenExpired',
                data: null
            });
        }
        if (err instanceof Error && err.name === 'JsonWebTokenError') {
            return res.json({
                success: false,
                message: 'Invalid Token',
                data: null
            });
        }
        return res.json({
            success: false,
            message: 'Authentication Failed',
            data: null
        });
    }

    console.log(decoded);
    req.userId = decoded.userId
    next()
}