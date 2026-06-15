import express, { type Request, type Response } from 'express'
import z from 'zod';
import cors from 'cors';
import { getGithubUsername, JWT_SECRET } from './utils/utils';
import { githubScraper } from './scrapers/github';
import { prisma } from '../prisma/db';
import jwt from "jsonwebtoken";
import { ta } from 'zod/locales';

const app = express();

app.use(express.json());
app.use(cors())

const formSchema = z.object({
    github: z.url(),
    linkedin: z.string().optional()
})

const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
})

const signinSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
})

const googleSchema = z.object({
    email: z.string()
})

app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server health's good",
        data: null
    })
})

app.post('/api/v1/auth/google', async (req: Request, res: Response) => {
    const { success, data } = googleSchema.safeParse(req.body);

    if (!success){
        return res.status(401).json({
            success: true,
            message: 'Email is required'
        })
    }
    
})

app.post('/api/v1/auth/signup', async (req: Request, res: Response) => {
    try {
        const { success, data } = signupSchema.safeParse(req.body);
    if (!success) {
        return res.status(401).json({
            success: false,
            message: "email and password are required",
            data: null
        })
    };

    const userExist = await prisma.user.findFirst({
        where: {
            email: data.email
        }
    });
    if (userExist) {
        return res.status(400).json({
            success: false,
            message: "User already exist",
            data: null
        })
    }
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: data.password
        }
    })

    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        audience: 'User',
        expiresIn: 7 * 24 * 60 * 60 * 1000,
        issuer: "quick-hire"
    })
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        audience: 'User',
        expiresIn: 2 * 60 * 60 * 1000,
        issuer: "quick-hire"
    })

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            refreshToken
        }
    });

    res.cookie('ref_token', refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })
    res.cookie('access_token', accessToken, {
        maxAge: 2 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })

    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
            id: user.id,
            email: user.email
        }
    })
    } catch (error) {
        console.log('Error in signup controller: ', error)
    }
})

app.post('/api/v1/auth/signin', async (req: Request, res: Response) => {
    try {
        const { success, data } = signinSchema.safeParse(req.body);
    if (!success) {
        return res.status(401).json({
            success: false,
            message: "email and password are required",
            data: null
        })
    };

    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        }
    });
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
            data: null
        })
    }
    if (user?.provider === 'GOOGLE') {
        return res.status(401).json({
            success: false,
            message: 'Account created using google',
            data: null
        })
    }

    if (user?.password != data.password) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
            data: null
        })
    };

    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        audience: 'User',
        expiresIn: 7 * 24 * 60 * 60 * 1000,
        issuer: "quick-hire"
    })
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        audience: 'User',
        expiresIn: 2 * 60 * 60 * 1000,
        issuer: "quick-hire"
    })

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            refreshToken
        }
    });

    res.cookie('ref_token', refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })
    res.cookie('access_token', accessToken, {
        maxAge: 2 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    })

    res.status(201).json({
        success: true,
        message: 'Account logged in successfully',
        data: {
            id: user.id,
            email: user.email
        }
    })
    } catch (error) {
        console.log('Error in signin controller: ', error)
    }
})

app.post('/api/v1/pre-interview', async (req: Request, res: Response) => {
    const result = formSchema.safeParse(req.body.form);
    if (!result.success) {
        return res.status(411).json({
            message: "GitHub and Linkedin urls are required",
            success: false,
            data: null
        })
    };

    const githubLink = result.data.github;
    const githubUsername = getGithubUsername(githubLink);
    if (!githubUsername) {
        return res.status(411).json({
            success: false,
            message: "Invalid username",
            data: null
        })
    }

    const scrapedData = await githubScraper(githubUsername);
    // const interview = await prisma.interview.create({
    //     data: {
    //         jobRole: "FULL-STACK",
    //         status: "SCHEDULED",
    //         githubMetadata: {title},
    //     }
    // })
    res.status(200).json({
        success: true,
        message: 'Interview created successfully',
        data: null
    })
})


app.listen(8000, () => {
    console.log(`Server is running at http://localhost:8000`)
})