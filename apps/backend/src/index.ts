import express, { type Request, type Response } from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import interviewRoutes from './routes/interview.routes';
import jobsRoutes from './routes/jobs.route';
import resumeRoutes from './routes/resume.routes';
import dashboardRoutes from './routes/dashboard.route';
import { errorHandler } from './middlewares/error.middleware';
import { NotFound } from './utils/NotFound';
import './workers/worker';
import 'dotenv/config';
import {
    startResumeParserWorker, startSourceFetchWorker, startJobsIngestWorker,
    startResumeAnalysisUploadWorker, startResumeAnalysisParserWorker, startResumeAnalysisScoreWorker,
    startInterviewFeedbackWorker
} from './workers/worker';
import { scheduleJobsIngest } from './queues/queue';

const app = express();

startResumeParserWorker();
startSourceFetchWorker();
startJobsIngestWorker();
startResumeAnalysisUploadWorker();
startResumeAnalysisParserWorker();
startResumeAnalysisScoreWorker();
startInterviewFeedbackWorker();
scheduleJobsIngest().catch((err) => console.error('Failed to schedule jobs ingest', err));

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173",credentials: true }))

app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server health's good",
        data: null
    })
})

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/interview', interviewRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(NotFound);
app.use(errorHandler)

app.listen(8000, () => {
    console.log(`Server is running at http://localhost:8000`)
})