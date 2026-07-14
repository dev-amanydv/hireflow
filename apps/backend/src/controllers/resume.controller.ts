import z from "zod";
import type { Request, Response } from "express";
import path from "path";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { enqueueAnalysisUpload, enqueueAnalysisScore } from "../queues/queue";

export const uploadResumeAnalysis = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const file = req.file;
  if (!file) throw new AppError(400, "ResumeRequired");

  const ext = path.extname(file.originalname);

  const analysis = await prisma.resumeAnalysis.create({
    data: {
      name: file.originalname,
      size: file.size,
      ext,
      status: "UPLOADING",
      userId,
    },
    select: { id: true },
  });

  const s3key = `users/${userId}/resume-analysis/${analysis.id}/${analysis.id}${ext}`;

  await enqueueAnalysisUpload({ analysisId: analysis.id, s3key }, file.path, file.size);

  res.status(201).json({
    success: true,
    message: "Resume uploaded, analysis started",
    data: { id: analysis.id },
  });
};

const targetSchema = z.object({
  role: z.string().min(1),
  experience: z.enum(["beginner", "junior", "mid", "senior", "staff"]).optional(),
  jobId: z.string().min(1).optional(),
  jdText: z.string().min(1).optional(),
});

export const setAnalysisTarget = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const id = req.params.id as string;
  const { success, data } = targetSchema.safeParse(req.body);
  if (!success) throw new AppError(400, "role is required");

  const row = await prisma.resumeAnalysis.findFirst({
    where: { id, userId },
    select: { id: true, status: true },
  });
  if (!row) throw new AppError(404, "AnalysisNotFound");
  if (row.status !== "PARSED" && row.status !== "COMPLETE") {
    throw new AppError(409, "Resume is not parsed yet");
  }

  let jdText = data.jdText ?? null;
  let targetJobId: string | null = null;
  if (data.jobId) {
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: { id: true, description: true },
    });
    if (job) {
      targetJobId = job.id;
      jdText = job.description;
    }
  }

  await prisma.resumeAnalysis.update({
    where: { id },
    data: {
      targetRole: data.role,
      targetExperience: data.experience ?? null,
      targetJobId,
      targetJdText: jdText,
      status: "ANALYZING",
      overallScore: null,
      report: undefined,
    },
  });

  await enqueueAnalysisScore({ analysisId: id, s3key: "" });

  res.status(200).json({
    success: true,
    message: "Scoring started",
    data: { id },
  });
};

export const getAnalysisStatus = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const id = req.params.id as string;
  const row = await prisma.resumeAnalysis.findFirst({
    where: { id, userId },
    select: { status: true },
  });
  if (!row) throw new AppError(404, "AnalysisNotFound");

  res.status(200).json({
    success: true,
    message: "Analysis status fetched",
    data: {
      status: row.status,
      parsed: row.status === "PARSED" || row.status === "ANALYZING" || row.status === "COMPLETE",
      ready: row.status === "COMPLETE",
      failed: row.status === "FAILED",
    },
  });
};

export const getAnalysis = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const id = req.params.id as string;
  const row = await prisma.resumeAnalysis.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      status: true,
      overallScore: true,
      report: true,
      summary: true,
      targetRole: true,
      targetExperience: true,
      targetJobId: true,
      error: true,
      createdAt: true,
    },
  });
  if (!row) throw new AppError(404, "AnalysisNotFound");

  res.status(200).json({
    success: true,
    message: "Analysis fetched",
    data: { analysis: row },
  });
};

export const listAnalyses = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const analyses = await prisma.resumeAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      status: true,
      overallScore: true,
      targetRole: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Analyses fetched",
    data: { analyses },
  });
};
