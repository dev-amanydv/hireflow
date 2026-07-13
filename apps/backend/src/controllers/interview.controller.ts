import z from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { resumeUploadQueue } from "../queues/queue";
import path from "path";
import { getResumeSummary, summarySchema } from "../services/openai";
import { Prisma } from "../generated/prisma/client";
import type { AssembledSources } from "../utils/AssembleProfile";
import {
  AccessToken,
  RoomConfiguration,
  RoomAgentDispatch,
} from "livekit-server-sdk";

const AGENT_NAME = "my-agent";

const roleDetailsSchema = z.object({
  role: z.string().min(1),
  experience: z.literal(["beginner", "junior", "mid", "senior", "staff"]),
});

const sessionDetailsSchema = z.object({
  interviewId: z.string().min(1),
});

export const handleRoleDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  if (!userId) throw new AppError(404, "Unauthorised");
  const { success, data } = roleDetailsSchema.safeParse(req.body);
  if (!success) throw new AppError(401, "RoleDetailsRequired");
  const interview = await prisma.interview.create({
    data: {
      jobRole: data.role,
      experience: data.experience,
      userId: userId,
    },
    select: {
      id: true,
    },
  });
  if (!interview) throw new AppError(504, "Internal Server Error");
  res.status(201).json({
    success: true,
    message: "Role Details Saved",
    data: {
      interview,
    },
  });
};

export const handleResume = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) throw new AppError(404, "Unauthorized");
    const resumeFile = req.file;
    const { interviewId } = req.body;

    if (!resumeFile) throw new AppError(404, "ResumeRequired");
    if (!interviewId) throw new AppError(400, "interviewId required");

    const ext = path.extname(resumeFile.originalname);
    const uniqueName = `${userId}-resume-${interviewId}${ext}`;
    const s3Key = `users/${userId}/${interviewId}/resume/${uniqueName}`;

    // Re-uploads reuse the same interview (interviewId is unique on Resume), so
    // upsert instead of create — inserting a second row would hit the unique
    // constraint and 500. Reset the parse state and clear any stale summary so
    // the new resume is re-parsed and re-summarised.
    const resume = await prisma.$transaction(async (tx) => {
      const row = await tx.resume.upsert({
        where: { interviewId },
        create: {
          name: resumeFile.filename,
          size: resumeFile.size,
          ext,
          status: "UPLOADED_LOCAL",
          interviewId,
        },
        update: {
          name: resumeFile.filename,
          size: resumeFile.size,
          ext,
          status: "UPLOADED_LOCAL",
          parsed: Prisma.DbNull,
          error: null,
          url: null,
        },
      });
      await tx.interview.update({
        where: { id: interviewId },
        data: { summary: null },
      });
      return row;
    });
    if (!resume) throw new AppError(501, "InternalServerError");
    await resumeUploadQueue.add(`${userId}-${interviewId}`, {
      resumeId: resume.id,
      filePath: resumeFile.path,
      s3Key: s3Key,
      size: resumeFile.size,
      interviewId: interviewId,
    });

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      data: {
        resume,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const handleResumeStatus = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const resume = await prisma.resume.findUnique({
    where: { interviewId },
    select: { status: true },
  });
  if (!resume) throw new AppError(404, "ResumeNotFound");

  res.status(200).json({
    success: true,
    message: "Resume status fetched",
    data: {
      status: resume.status,
      ready: resume.status === "PARSED",
      failed: resume.status === "FAILED",
    },
  });
};

export const handlePreSession = async (req: Request, res: Response) => {
  const { success, data } = sessionDetailsSchema.safeParse(req.body);
  if (!success) throw new AppError(401, "interviewId required");

  const interview = await prisma.interview.findUnique({
    where: { id: data.interviewId },
    select: { summary: true },
  });
  if (interview?.summary) {
    res.status(200).json({
      success: true,
      message: "Summary already generated",
      data: JSON.parse(interview.summary),
    });
    return;
  }

  const resume = await prisma.resume.findUnique({
    where: { interviewId: data.interviewId },
    select: { status: true, parsed: true },
  });
  if (!resume) throw new AppError(404, "ResumeNotFound");
  if (resume.status === "FAILED") throw new AppError(422, "ResumeParseFailed");
  if (resume.status !== "PARSED" || !resume.parsed) {
    res.status(202).json({
      success: false,
      message: "ResumeNotReady",
      data: null,
    });
    return;
  }

  const parsedData = resume.parsed as unknown as AssembledSources;
  const summary = await getResumeSummary(parsedData);

  await prisma.interview.update({
    where: {
      id: data.interviewId,
    },
    data: {
      summary: JSON.stringify(summary),
    },
  });

  res.status(201).json({
    success: true,
    message: "Summary fetched successfully",
    data: summary,
  });
};

export const updateSummary = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const { success, data } = summarySchema.safeParse(req.body);
  if (!success) throw new AppError(400, "InvalidSummary");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { id: true },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  await prisma.interview.update({
    where: { id: interviewId },
    data: { summary: JSON.stringify(data) },
  });

  res.status(200).json({
    success: true,
    message: "Summary updated",
    data,
  });
};

export const generateLivekitToken = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { id: true, summary: true, jobRole: true, experience: true },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const roomName = `interview-${interviewId}`;
  const participantIdentity = `${userId}-${interviewId}`;
  const participantName = user?.email?.split("@")[0] ?? "candidate";
  const context = {
    userId,
    interviewId,
    email: user?.email ?? "",
    jobRole: interview.jobRole,
    experience: interview.experience,
    summary: interview.summary,
  };

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantIdentity,
      name: participantName,
      metadata: JSON.stringify(context),
      attributes: { userId, interviewId, email: user?.email ?? "" },
      ttl: "30m",
    },
  );

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: AGENT_NAME,
        metadata: JSON.stringify(context),
      }),
    ],
  });

  const participantToken = await at.toJwt();

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "ONGOING", startAt: new Date() },
  });

  res.status(201).json({
    server_url: process.env.LIVEKIT_URL,
    participant_token: participantToken,
  });
};

const messageSchema = z.object({
  role: z.literal(["User", "Assistant"]),
  content: z.string().min(1),
  createdAt: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) ? new Date(n * 1000) : new Date(v as string);
    }),
});


export const recordInterviewMessage = async (req: Request, res: Response) => {
  const interviewId = req.params.interviewId as string;
  const { success, data } = messageSchema.safeParse(req.body);
  if (!success) throw new AppError(400, "Invalid message");
  await prisma.message.create({
    data: { interviewId, role: data.role, content: data.content, createdAt: data.createdAt },
  });

  res.status(201).json({ success: true, message: "Message recorded", data: null });
};


export const completeInterview = async (req: Request, res: Response) => {
  const interviewId = req.params.interviewId as string;

  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "COMPLETED", endAt: new Date() },
  });

  res.status(200).json({ success: true, message: "Interview completed", data: null });
};
