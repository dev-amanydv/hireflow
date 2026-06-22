import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (err: Error | null, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError){
        statusCode = err.statusCode;
        message = err.message;
    } if (err?.name === 'JsonWebTokenError'){
        statusCode = 401;
        message = 'Invalid token'
    } if (err?.name === 'TokenExpiredError'){
        statusCode = 401
        message = 'TokenExpiredError'
    } else {
        message = err?.message || message
    };

    const response = {
        success: false,
        message: message,
        data: null
    };

    console.error({
        method: req.method,
        url: req.originalUrl,
        error: err
    });
    
    res.status(statusCode).json(response)
}