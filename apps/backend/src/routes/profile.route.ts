import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    uploadMyAvatar,
    getPublicProfile,
    getPublicInterview,
} from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { avatarUploadMiddleware } from '../middlewares/avatarUpload.middleware';
import { AsyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Static /me routes must come before the /:username wildcard below.
router.get('/me', authMiddleware, AsyncHandler(getMyProfile));
router.patch('/me', authMiddleware, AsyncHandler(updateMyProfile));
router.post('/me/avatar', authMiddleware, avatarUploadMiddleware, AsyncHandler(uploadMyAvatar));

// Public, unauthenticated lookups.
router.get('/:username/interview/:interviewId', AsyncHandler(getPublicInterview));
router.get('/:username', AsyncHandler(getPublicProfile));

export default router;
