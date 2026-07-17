import type { Request, Response } from "express";
import axios from "axios";
import jwt from 'jsonwebtoken';
import z from "zod";
import { prisma } from "../../prisma/db";
import { JWT_SECRET } from "../utils/utils";
import { GUEST_COOKIE } from "../middlewares/identity.middleware";

const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
});

const signinSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
})

const googleSchema = z.object({
    accessToken: z.string().min(1)
})

function genUniqueUsername (email: string) {
    const base = email.split('@')[0] || "guest";
    const clean = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const unique = clean + crypto.randomUUID().slice(3,7).replace('-', '');

    return unique
}


async function claimGuestWork(req: Request, res: Response, userId: string) {
    const guestId = req.cookies?.[GUEST_COOKIE];
    if (!guestId) return;

    await prisma.resumeAnalysis.updateMany({
        where: { guestId },
        data: { userId, guestId: null }
    });
    res.clearCookie(GUEST_COOKIE);
}

async function issueSession(req: Request, res: Response, user: { id: string; email: string }) {
    const payload = { userId: user.id, email: user.email };
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
        audience: 'User',
        expiresIn: '7d',
        issuer: "quick-hire"
    })
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        audience: 'User',
        expiresIn: '2h',
        issuer: "quick-hire"
    })

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
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

    await claimGuestWork(req, res, user.id);
}

export const handleSignup = async (req: Request, res: Response) => {
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
    let user;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            user = await prisma.user.create({
                data: {
                    email: data.email,
                    password: data.password,
                    username: genUniqueUsername(data.email)
                }
            });
            break;
        } catch (err: any) {
            if (err?.code === 'P2002' && attempt < 4) continue;
            throw err;
        }
    }

    if (!user) throw new Error('Failed to create user');

    await issueSession(req, res, { id: user.id, email: user.email });

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
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Something went wrong', data: null })
        }
    }
}


export const handleSignin = async (req: Request, res: Response) => {
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

    await issueSession(req, res, { id: user.id, email: user.email });

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
}

export const handleGoogle = async (req: Request, res: Response) => {
    try {
        const { success, data } = googleSchema.safeParse(req.body);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Google access token is required',
                data: null
            })
        }

        let profile: { email?: string; email_verified?: boolean | string };
        try {
            const { data: userinfo } = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: `Bearer ${data.accessToken}` } }
            );
            profile = userinfo;
        } catch {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired Google session',
                data: null
            })
        }

        const email = profile.email;
        const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
        if (!email || !emailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Google account email is not verified',
                data: null
            })
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    user = await prisma.user.create({
                        data: {
                            email,
                            provider: 'GOOGLE',
                            username: genUniqueUsername(email)
                        }
                    });
                    break;
                } catch (err: any) {
                    if (err?.code === 'P2002' && attempt < 4) continue;
                    throw err;
                }
            }
        }

        await issueSession(req, res, { id: user!.id, email: user!.email });

        res.status(200).json({
            success: true,
            message: 'Logged in with Google',
            data: {
                id: user!.id,
                email: user!.email
            }
        })
    } catch (error) {
        console.log('Error in google controller: ', error)
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Something went wrong', data: null })
        }
    }
}