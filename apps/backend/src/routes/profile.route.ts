import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    uploadMyAvatar,
    uploadMyResume,
    getPublicProfile,
    getPublicInterview,
} from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { avatarUploadMiddleware } from '../middlewares/avatarUpload.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { AsyncHandler } from '../utils/AsyncHandler';

const router = express.Router();

router.get('/me', authMiddleware, AsyncHandler(getMyProfile));
router.patch('/me', authMiddleware, AsyncHandler(updateMyProfile));
router.post('/me/avatar', authMiddleware, avatarUploadMiddleware, AsyncHandler(uploadMyAvatar));
router.post('/me/resume', authMiddleware, uploadMiddleware, AsyncHandler(uploadMyResume));

router.get('/:username/interview/:interviewId', AsyncHandler(getPublicInterview));
router.get('/:username', AsyncHandler(getPublicProfile));

export default router;
