import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/utils";

interface JwtPayload {
    userId: string,
    email: string
}

export const GUEST_COOKIE = 'guest_id';

const GUEST_COOKIE_OPTIONS = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none'
} as const;

export const identityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.access_token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            req.userId = decoded.userId;
            return next();
        } catch {
            
        }
    }

    let guestId = req.cookies?.[GUEST_COOKIE];
    if (!guestId) {
        guestId = crypto.randomUUID();
        res.cookie(GUEST_COOKIE, guestId, GUEST_COOKIE_OPTIONS);
    }
    req.guestId = guestId;
    next();
};

export type OwnerScope = { userId: string } | { guestId: string };


export function ownerScope(req: Request): OwnerScope {
    if (req.userId) return { userId: req.userId };
    if (req.guestId) return { guestId: req.guestId };
    throw new Error("ownerScope called without identityMiddleware");
}
