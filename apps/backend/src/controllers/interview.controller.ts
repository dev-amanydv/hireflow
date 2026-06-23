import z from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";

const roleDetailsSchema = z.object({
    role: z.string().min(1),
    type: z.literal(['mixed', 'behavioural', 'technical', 'systemDesign']),
    experience: z.literal(["beginner", "junior", "mid", "senior", "staff"])
})

export const handleRoleDetails = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) throw new AppError(404, 'Unauthorised');
    const { success, data } = roleDetailsSchema.safeParse(req.body);
    if (!success) throw new AppError(401, 'RoleDetailsRequired');
    const interview = await prisma.interview.create({
        data: {
            jobRole: data.role,
            type: data.type,
            experience: data.experience,
            userId: userId
        }, select: {
            id: true
        }
    });
    if (!interview) throw new AppError(504, 'Internal Server Error');
    res.status(201).json({
        success: true,
        message: 'Role Details Saved',
        data: {
            interview
        }
    })
}

export const handlePreInterview = async (req: Request, res: Response) => {
    try {
        const resume = req.file;
        console.log(resume);
        if (!resume) throw new AppError(404, "ResumeRequired");
        res.status(200).json({
        success: true,
        message: 'Interview created successfully',
        data: null
    })
    } catch (error) {
        res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
    })
    }
}