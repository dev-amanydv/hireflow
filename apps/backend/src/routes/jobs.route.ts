import express from 'express';
import { listJobs } from '../controllers/jobs.controller';
import { AsyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.get('/', AsyncHandler(listJobs));

export default router;
