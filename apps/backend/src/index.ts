import express, { type Request, type Response } from 'express'
import z, { success } from 'zod';
import cors from 'cors';
import { getGithubUsername } from './utils/utils';
import { githubScraper } from './scrapers/github';

const app = express();

app.use(express.json());
app.use(cors())
const formSchema = z.object({
    github: z.url(),
    linkedin: z.string().optional()
})

app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server health's good",
        data: null
    })
})

app.post('/api/v1/pre-interview', async (req: Request, res: Response) => {
    const result = formSchema.safeParse(req.body.form);
    if (!result.success){
        return res.status(411).json({
            message: "GitHub and Linkedin urls are required",
            success: false,
            data: null
        })
    };

    const githubLink = result.data.github;
    const githubUsername = getGithubUsername(githubLink);
    if (!githubUsername){
        return res.status(411).json({
            success: false,
            message: "Invalid username",
            data: null
        })
    }

    const scrapedData = await githubScraper(githubUsername);

    res.status(200).json({
        success: true,
        message: 'Interview created successfully',
        data: null
    })
})


app.listen(8000, () => {
    console.log(`Server is running at http://localhost:8000`)
})