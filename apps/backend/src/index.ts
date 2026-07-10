import express, { type Request, type Response } from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import interviewRoutes from './routes/interview.routes';
import { errorHandler } from './middlewares/error.middleware';
import { NotFound } from './utils/NotFound';
import './workers/worker';
import 'dotenv/config';
import { startResumeParserWorker, startSourceFetchWorker } from './workers/worker';
import { WebSocketServer } from "ws"
import type { tryCatch } from 'bullmq';

const app = express();

startResumeParserWorker();
startSourceFetchWorker();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173",credentials: true }))

const wss = new WebSocketServer({ port:  8000 })

wss.on("connection", (ws, request) => {
    ws.on("message", (data: string) => {
        let message;
        try {
            message = JSON.parse(data)
            console.log(message)
        } catch (error) {
            ws.send(JSON.stringify({ error: "Invalid JSON" }))
            return
        }
        ws.send(JSON.stringify({ type: "hello"}))
        
    })
})

app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server health's good",
        data: null
    })
})

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/interview', interviewRoutes);

app.use(NotFound);
app.use(errorHandler)

app.listen(8000, () => {
    console.log(`Server is running at http://localhost:8000`)
})