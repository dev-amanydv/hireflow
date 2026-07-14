import express from 'express';
import { handlePreSession, handleResume, handleResumeStatus, handleRoleDetails, generateLivekitToken, recordInterviewMessage, completeInterview, updateSummary, listPracticeSkills, getPracticeSkillDetail, handlePracticeDetails, getInterviewResult, getInterviewTranscript, listInterviews } from '../controllers/interview.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { internalAuth } from '../middlewares/internal.middleware';

const router = express.Router();

router.post('/pre/role', authMiddleware, AsyncHandler(handleRoleDetails));

router.get('/practice/skills', authMiddleware, AsyncHandler(listPracticeSkills));
router.get('/practice/skills/:id', authMiddleware, AsyncHandler(getPracticeSkillDetail));
router.post('/practice', authMiddleware, AsyncHandler(handlePracticeDetails));
router.get('/list', authMiddleware, AsyncHandler(listInterviews));

router.post('/pre/resume', authMiddleware, uploadMiddleware, AsyncHandler(handleResume));
router.get('/pre/:interviewId/resume-status', authMiddleware, AsyncHandler(handleResumeStatus));
router.post('/pre/session', authMiddleware, AsyncHandler(handlePreSession));
router.patch('/pre/:interviewId/summary', authMiddleware, AsyncHandler(updateSummary));
router.post('/pre/:interviewId/get-token', authMiddleware, AsyncHandler(generateLivekitToken))

router.get('/:interviewId/result', authMiddleware, AsyncHandler(getInterviewResult));
router.get('/:interviewId/transcript', authMiddleware, AsyncHandler(getInterviewTranscript));


router.post('/:interviewId/messages', internalAuth, AsyncHandler(recordInterviewMessage));
router.post('/:interviewId/complete', internalAuth, AsyncHandler(completeInterview));

export default router;