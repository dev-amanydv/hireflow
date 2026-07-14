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

// Returns the curated skill catalog for the practice picker UI.
export const listPracticeSkills = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Practice skills fetched",
    data: { skills: listSkills() },
  });
};

// Returns a single skill's full detail (topic outline + per-level rubric) for the
// skill detail page. Unlike listSkills(), this exposes topics/subtopics/rubrics.
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

// Creates a resume-less, skill-focused practice interview. Mirrors handleRoleDetails
// but branches on a curated skill instead of a free-text role + resume upload.
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
    select: {
      id: true,
      summary: true,
      jobRole: true,
      experience: true,
      type: true,
      skill: true,
    },
  });
  if (!interview) throw new AppError(404, "Interview not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const roomName = `interview-${interviewId}`;
  const participantIdentity = `${userId}-${interviewId}`;
  const participantName = user?.email?.split("@")[0] ?? "candidate";
  // Practice interviews have no resume summary; the agent is instead grounded in a
  // curated skill focus block rendered from the catalog for the chosen difficulty.
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

  // Kick off the async scorecard pass so it never blocks the agent's shutdown callback.
  await enqueueInterviewFeedback(interviewId).catch((err) =>
    console.error("Failed to enqueue interview feedback", err),
  );

  res.status(200).json({ success: true, message: "Interview completed", data: null });
};

// Lists the signed-in user's interviews for the "Past interviews" dashboard section.
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
        score: i.result?.score ?? null,
      })),
    },
  });
};

// Polled by the result page while the async feedback job runs.
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
      ready: Boolean(interview.result),
      result: interview.result ?? null,
    },
  });
};

// Returns the full ordered transcript plus header context, used by the result
// page to generate a downloadable PDF. Scoped to the owning user.
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
