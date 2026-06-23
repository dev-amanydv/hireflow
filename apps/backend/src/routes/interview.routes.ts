import express from 'express';
import { handlePreInterview, handleRoleDetails } from '../controllers/interview.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/pre/role', authMiddleware,uploadMiddleware, AsyncHandler(handleRoleDetails));
router.post('/pre/session', authMiddleware, uploadMiddleware, AsyncHandler(handlePreInterview));

export default router;