import express from 'express';
import {
  listJobs,
  listSavedJobs,
  saveJob,
  unsaveJob,
} from '../controllers/jobs.controller';
import { AsyncHandler } from '../utils/AsyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', AsyncHandler(listJobs));
router.get('/saved', authMiddleware, AsyncHandler(listSavedJobs));
router.post('/:id/save', authMiddleware, AsyncHandler(saveJob));
router.delete('/:id/save', authMiddleware, AsyncHandler(unsaveJob));

export default router;
