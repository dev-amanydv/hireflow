import express from 'express';
import { handlePreInterview } from '../controllers/interview.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.post('/pre', uploadMiddleware, AsyncHandler(handlePreInterview));

export default router;