import express, { type Request, type Response } from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import interviewRoutes from './routes/interview.routes';
import jobsRoutes from './routes/jobs.route';
import resumeRoutes from './routes/resume.routes';
import dashboardRoutes from './routes/dashboard.route';
import profileRoutes from './routes/profile.route';
import { errorHandler } from './middlewares/error.middleware';
import { NotFound } from './utils/NotFound';
import 'dotenv/config';

process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

const app = express();

app.use(express.json());
app.use(cookieParser());
const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173";
app.use(cors({ origin: corsOrigin, credentials: true }))

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
app.use('/api/v1/profile', profileRoutes);

app.use(NotFound);
app.use(errorHandler)

const port = Number(process.env.PORT) || 8000;
app.listen(port, async () => {
    console.log(`Server listening on :${port}`)
    try {
        const w = await import('./workers/worker');
        const workers = [
            w.startResumeUploadWorker(),
            w.startResumeParserWorker(),
            w.startSourceFetchWorker(),
            w.startJobsIngestWorker(),
            w.startResumeAnalysisUploadWorker(),
            w.startResumeAnalysisParserWorker(),
            w.startResumeAnalysisScoreWorker(),
            w.startInterviewFeedbackWorker(),
            w.startProfileResumeWorker(),
        ];
        
        for (const worker of workers) {
            worker.on('error', (err) => console.error('[worker] error:', err.message));
        }
        const { scheduleJobsIngest } = await import('./queues/queue');
        await scheduleJobsIngest();
    } catch (err) {
        console.error('deferred worker startup failed', err);
    }
})