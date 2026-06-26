import type { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import z from "zod";
import { prisma } from "../../prisma/db";
import { JWT_SECRET } from "../utils/utils";

const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
});

const signinSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
})

const googleSchema = z.object({
    email: z.string()
})

function genUniqueUsername (email: string) {
    const base = email.split('@')[0] || "guest";
    const clean = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const unique = clean + crypto.randomUUID().slice(3,7).replace('-', '');

    return unique
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
    const username = genUniqueUsername(data.email);
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: data.password,
            username: username
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
}

export const handleGoogle = async (req: Request, res: Response) => {
    const { success, data } = googleSchema.safeParse(req.body);

    if (!success){
        return res.status(401).json({
            success: true,
            message: 'Email is required'
        })
    }
}