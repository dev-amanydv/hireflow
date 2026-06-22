import z from "zod";
import { getGithubUsername } from "../utils/utils";
import type { Request, Response } from "express";
import { githubScraper } from "../scrapers/github";

const formSchema = z.object({
    github: z.url(),
    linkedin: z.string().optional()
})

export const handlePreInterview = async (req: Request, res: Response) => {
    try {
        const resume = req.file;
        if (!resume) 
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