import express from 'express';
import { handlePreInterview } from '../controllers/interview.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = express.Router();

router.post('/', authMiddleware, uploadMiddleware, handlePreInterview);

export default router;