import express from 'express';
import { handlePreSession, handleResume, handleRoleDetails } from '../controllers/interview.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/pre/role', authMiddleware, AsyncHandler(handleRoleDetails));
router.post('/pre/resume', authMiddleware, uploadMiddleware, AsyncHandler(handleResume));
router.post('/pre/session', authMiddleware, AsyncHandler(handlePreSession));
router.post('/pre/:interviewId/get-token', authMiddleware, AsyncHandler(handlePre))
export default router;