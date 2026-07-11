import z from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { resumeUploadQueue } from "../queues/queue";
import path from "path";
import { getResumeSummary } from "../services/openai";
import type { AssembledSources } from "../utils/AssembleProfile";
import {
  AccessToken,
  RoomConfiguration,
  RoomAgentDispatch,
} from "livekit-server-sdk";

const AGENT_NAME = "my-agent";

const roleDetailsSchema = z.object({
  role: z.string().min(1),
  type: z.literal(["mixed", "behavioural", "technical", "systemDesign"]),
  experience: z.literal(["beginner", "junior", "mid", "senior", "staff"]),
});

const sessionDetailsSchema = z.object({
  interviewId: z.string().min(1),
  questions: z.int(),
  duration: z.int(),
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
      type: data.type,
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
        status: "UPLOADED_LOCAL",
        interviewId: interviewId,
      },
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

export const handlePreSession = async (req: Request, res: Response) => {
  const { success, data } = sessionDetailsSchema.safeParse(req.body);
  if (!success)
    throw new AppError(401, "Invalid count of questions & duration");

  const userData = await prisma.resume.findUnique({
    where: {
      interviewId: data.interviewId,
    },
    select: {
      parsed: true,
    },
  });
  const parsedData = userData?.parsed as unknown as AssembledSources;
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

export const generateLivekitToken = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { id: true },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const roomName = `interview-${interviewId}`;
  const participantIdentity = `${userId}-${interviewId}`;
  const participantName = user?.email?.split("@")[0] ?? "candidate";
  const context = { userId, interviewId, email: user?.email ?? "" };

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
});


export const recordInterviewMessage = async (req: Request, res: Response) => {
  const interviewId = req.params.interviewId as string;
  const { success, data } = messageSchema.safeParse(req.body);
  if (!success) throw new AppError(400, "Invalid message");

  await prisma.message.create({
    data: { interviewId, role: data.role, content: data.content },
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
