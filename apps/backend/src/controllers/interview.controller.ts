import z from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { resumeUploadQueue } from "../queues/queue";
import path from 'path';

const roleDetailsSchema = z.object({
    role: z.string().min(1),
    type: z.literal(['mixed', 'behavioural', 'technical', 'systemDesign']),
    experience: z.literal(["beginner", "junior", "mid", "senior", "staff"])
})

export const handleRoleDetails = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    console.log('hit')
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

export const handleResume = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) throw new AppError(404, 'Unauthorized')
        const resumeFile = req.file;
        const { interviewId } = req.body;

        console.log(resumeFile);
        if (!resumeFile) throw new AppError(404, "ResumeRequired");

        const ext = path.extname(resumeFile.originalname);
        const uniqueName = `${userId}-resume-${interviewId}${ext}`;
        const s3Key = `users/${userId}/${interviewId}/resume/${uniqueName}`;

        const resume = await prisma.resume.create({
            data: {
                name: resumeFile.filename,
                size: resumeFile.size,
                ext: ext,
                status: 'UPLOADED_LOCAL',
                interviewId: interviewId
            }
        })
        if (!resume) throw new AppError(501, 'InternalServerError');

        await resumeUploadQueue.add(`${userId}-${interviewId}`, {
            resumeId: resume.id,
            filePath: resumeFile.path,
            s3Key: s3Key,
            size: resumeFile.size
        });

        res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: {
            resume
        }
    })
    } catch (error) {
        res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
    })
    }
}

export const handlePreSession = async (req: Request, res: Response) => {
    
}