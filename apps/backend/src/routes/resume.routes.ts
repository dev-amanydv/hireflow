import express from 'express';
import {
    uploadResumeAnalysis,
    setAnalysisTarget,
    getAnalysisStatus,
    getAnalysis,
    listAnalyses,
} from '../controllers/resume.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', authMiddleware, AsyncHandler(listAnalyses));
router.post('/upload', authMiddleware, uploadMiddleware, AsyncHandler(uploadResumeAnalysis));
router.post('/:id/target', authMiddleware, AsyncHandler(setAnalysisTarget));
router.get('/:id/status', authMiddleware, AsyncHandler(getAnalysisStatus));
router.get('/:id', authMiddleware, AsyncHandler(getAnalysis));

export default router;
