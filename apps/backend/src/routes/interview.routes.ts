import express from 'express';
import { handlePreSession, handleResume, handleRoleDetails, generateLivekitToken, recordInterviewMessage, completeInterview } from '../controllers/interview.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { internalAuth } from '../middlewares/internal.middleware';

const router = express.Router();

router.post('/pre/role', authMiddleware, AsyncHandler(handleRoleDetails));
router.post('/pre/resume', authMiddleware, uploadMiddleware, AsyncHandler(handleResume));
router.post('/pre/session', authMiddleware, AsyncHandler(handlePreSession));
router.post('/pre/:interviewId/get-token', authMiddleware, AsyncHandler(generateLivekitToken))

router.post('/:interviewId/messages', internalAuth, AsyncHandler(recordInterviewMessage));
router.post('/:interviewId/complete', internalAuth, AsyncHandler(completeInterview));

export default router;