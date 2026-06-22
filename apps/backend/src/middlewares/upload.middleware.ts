import type { NextFunction, Request, Response } from "express";
import multer from 'multer';

const upload = multer({dest: 'uploads/', limits: {
    fileSize: 10000
}});

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
    upload.single('resume');
    next()
}