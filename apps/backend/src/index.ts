import express, { type Request, type Response } from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import interviewRoutes from './routes/interview.routes';

const app = express();

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
app.post('/api/v1/pre-interview', interviewRoutes);

app.listen(8000, () => {
    console.log(`Server is running at http://localhost:8000`)
})