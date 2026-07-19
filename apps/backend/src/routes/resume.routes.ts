import express from 'express';
import {
    uploadResumeAnalysis,
    setAnalysisTarget,
    getAnalysisStatus,
    getAnalysis,
    listAnalyses,
} from '../controllers/resume.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/AsyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { identityMiddleware } from '../middlewares/identity.middleware';

const router = express.Router();

router.get('/', authMiddleware, AsyncHandler(listAnalyses));
router.post('/upload', identityMiddleware, uploadMiddleware, AsyncHandler(uploadResumeAnalysis));
router.post('/:id/target', identityMiddleware, AsyncHandler(setAnalysisTarget));
router.get('/:id/status', identityMiddleware, AsyncHandler(getAnalysisStatus));
router.get('/:id', identityMiddleware, AsyncHandler(getAnalysis));

export default router;
