import z from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { resumeUploadQueue, enqueueInterviewFeedback } from "../queues/queue";
import path from "path";
import { getResumeSummary, summarySchema } from "../services/openai";
import { Prisma } from "../generated/prisma/client";
import type { AssembledSources } from "../utils/AssembleProfile";
import {
  AccessToken,
  RoomConfiguration,
  RoomAgentDispatch,
} from "livekit-server-sdk";
import {
  buildSkillFocus,
  getSkill,
  listSkills,
  type Difficulty,
} from "../data/skillCatalog";
import { uploadToBucket, getPresignedGetUrl } from "../utils/upload";

const AGENT_NAME = "my-agent";

const roleDetailsSchema = z.object({
  role: z.string().min(1),
  experience: z.literal(["beginner", "junior", "mid", "senior", "staff"]),
});

const practiceDetailsSchema = z.object({
  skill: z.string().min(1),
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

export const listPracticeSkills = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Practice skills fetched",
    data: { skills: listSkills() },
  });
};

export const getPracticeSkillDetail = async (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  const skill = getSkill(id);
  if (!skill) throw new AppError(404, "UnknownSkill");
  res.status(200).json({
    success: true,
    message: "Practice skill fetched",
    data: { skill },
  });
};

export const handlePracticeDetails = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(404, "Unauthorised");
  const { success, data } = practiceDetailsSchema.safeParse(req.body);
  if (!success) throw new AppError(401, "PracticeDetailsRequired");

  const skill = getSkill(data.skill);
  if (!skill) throw new AppError(400, "UnknownSkill");

  const interview = await prisma.interview.create({
    data: {
      type: "PRACTICE",
      skill: skill.id,
      jobRole: skill.label,
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
    message: "Practice Interview Created",
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

  const claim = await prisma.interview.updateMany({
    where: { id: interviewId, userId, status: "SCHEDULED" },
    data: { status: "ONGOING", startAt: new Date(), recordingStatus: "PROCESSING" },
  });
  if (claim.count === 0) {
    const exists = await prisma.interview.findFirst({
      where: { id: interviewId, userId },
      select: { id: true },
    });
    if (!exists) throw new AppError(404, "Interview not found");
    throw new AppError(409, "InterviewAlreadyStarted");
  }

  const interview = await prisma.interview.findUniqueOrThrow({
    where: { id: interviewId },
    select: {
      id: true,
      summary: true,
      jobRole: true,
      experience: true,
      type: true,
      skill: true,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const roomName = `interview-${interviewId}`;
  const participantIdentity = `${userId}-${interviewId}`;
  const participantName = user?.email?.split("@")[0] ?? "candidate";
  const skillFocus =
    interview.type === "PRACTICE" && interview.skill
      ? buildSkillFocus(interview.skill, interview.experience as Difficulty)
      : null;
  const context = {
    userId,
    interviewId,
    email: user?.email ?? "",
    type: interview.type,
    jobRole: interview.jobRole,
    experience: interview.experience,
    summary: interview.summary,
    skillFocus,
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

  await enqueueInterviewFeedback(interviewId).catch((err) =>
    console.error("Failed to enqueue interview feedback", err),
  );

  res.status(200).json({ success: true, message: "Interview completed", data: null });
};

export const listInterviews = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      skill: true,
      jobRole: true,
      experience: true,
      status: true,
      createdAt: true,
      recordingStatus: true,
      recordingDurationMs: true,
      isPublic: true,
      result: { select: { score: true } },
    },
  });

  res.status(200).json({
    success: true,
    message: "Interviews fetched",
    data: {
      interviews: interviews.map((i) => ({
        id: i.id,
        type: i.type,
        skill: i.skill,
        jobRole: i.jobRole,
        experience: i.experience,
        status: i.status,
        createdAt: i.createdAt,
        recordingStatus: i.recordingStatus,
        recordingDurationMs: i.recordingDurationMs,
        isPublic: i.isPublic,
        score: i.result?.score ?? null,
      })),
    },
  });
};

export const listPublicInterviews = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const interviews = await prisma.interview.findMany({
    where: { isPublic: true, recordingStatus: "READY" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit,
    select: {
      id: true,
      jobRole: true,
      skill: true,
      experience: true,
      type: true,
      createdAt: true,
      recordingStatus: true,
      recordingDurationMs: true,
      user: { select: { username: true, displayName: true, avatarKey: true } },
    },
  });

  const withAvatars = await Promise.all(
    interviews
      .filter((i) => i.user.username)
      .map(async (i) => ({
        id: i.id,
        jobRole: i.jobRole,
        skill: i.skill,
        experience: i.experience,
        type: i.type,
        createdAt: i.createdAt,
        recordingStatus: i.recordingStatus,
        recordingDurationMs: i.recordingDurationMs,
        username: i.user.username as string,
        displayName: i.user.displayName,
        avatarUrl: i.user.avatarKey
          ? await getPresignedGetUrl(i.user.avatarKey, { expiresIn: 3600 })
          : null,
      })),
  );

  const nextCursor = interviews.length === limit ? interviews[interviews.length - 1]!.id : null;

  res.status(200).json({
    success: true,
    message: "Public interviews fetched",
    data: { interviews: withAvatars, nextCursor },
  });
};

export const getInterviewResult = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: {
      id: true,
      status: true,
      type: true,
      skill: true,
      jobRole: true,
      experience: true,
      createdAt: true,
      recordingStatus: true,
      recordingDurationMs: true,
      isPublic: true,
      result: { select: { score: true, report: true } },
    },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  res.status(200).json({
    success: true,
    message: "Interview result fetched",
    data: {
      status: interview.status,
      type: interview.type,
      skill: interview.skill,
      jobRole: interview.jobRole,
      experience: interview.experience,
      createdAt: interview.createdAt,
      recordingStatus: interview.recordingStatus,
      recordingDurationMs: interview.recordingDurationMs,
      isPublic: interview.isPublic,
      ready: Boolean(interview.result),
      result: interview.result ?? null,
    },
  });
};

export const getInterviewTranscript = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: {
      id: true,
      type: true,
      skill: true,
      jobRole: true,
      experience: true,
      createdAt: true,
      messages: {
        orderBy: { id: "asc" },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  res.status(200).json({
    success: true,
    message: "Interview transcript fetched",
    data: {
      type: interview.type,
      skill: interview.skill,
      jobRole: interview.jobRole,
      experience: interview.experience,
      createdAt: interview.createdAt,
      messages: interview.messages,
    },
  });
};

const RECORDING_EXT: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
};

export const uploadInterviewRecording = async (req: Request, res: Response) => {
  const interviewId = req.params.interviewId as string;
  const file = req.file;
  if (!file) throw new AppError(400, "recording file required");

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: { id: true, userId: true },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  const mime = file.mimetype || "audio/ogg";
  const ext = RECORDING_EXT[mime] ?? "ogg";
  const key = `users/${interview.userId}/${interviewId}/recording/interview.${ext}`;

  const upload = await uploadToBucket(key, file.buffer, file.size, mime);
  if (!upload.success) {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { recordingStatus: "FAILED" },
    });
    throw new AppError(502, "Failed to store recording");
  }

  const durationMs = Number(req.body?.durationMs);
  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      recordingKey: key,
      recordingStatus: "READY",
      recordingDurationMs: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
    },
  });

  res.status(201).json({ success: true, message: "Recording stored", data: null });
};

export const getInterviewRecording = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  if (!interviewId) throw new AppError(400, "interviewId required");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: {
      recordingKey: true,
      recordingStatus: true,
      recordingDurationMs: true,
      jobRole: true,
    },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  if (interview.recordingStatus !== "READY" || !interview.recordingKey) {
    res.status(200).json({
      success: true,
      message: "Recording not ready",
      data: {
        status: interview.recordingStatus,
        url: null,
        durationMs: interview.recordingDurationMs,
      },
    });
    return;
  }

  const download = req.query.download === "1" || req.query.download === "true";
  const ext = interview.recordingKey.split(".").pop() || "m4a";
  const filename = `${interview.jobRole ?? "interview"}-recording.${ext}`
    .replace(/[^a-z0-9.-]+/gi, "-")
    .toLowerCase();

  const url = await getPresignedGetUrl(interview.recordingKey, {
    expiresIn: 3600,
    downloadFilename: download ? filename : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Recording url generated",
    data: {
      status: interview.recordingStatus,
      url,
      durationMs: interview.recordingDurationMs,
    },
  });
};

const visibilitySchema = z.object({ isPublic: z.boolean() });

export const setInterviewVisibility = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const interviewId = req.params.interviewId as string;
  const { success, data } = visibilitySchema.safeParse(req.body);
  if (!success) throw new AppError(400, "isPublic (boolean) is required");

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { id: true },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  await prisma.interview.update({
    where: { id: interviewId },
    data: { isPublic: data.isPublic },
  });

  res.status(200).json({
    success: true,
    message: data.isPublic ? "Interview is now public" : "Interview is now private",
    data: { isPublic: data.isPublic },
  });
};
