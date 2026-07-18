import z from "zod";
import path from "path";
import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { uploadToBucket, getPresignedGetUrl } from "../utils/upload";
import { enqueueProfileResume } from "../queues/queue";
import type { ParsedSummary } from "../services/ats/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function computeStreak(createdAts: Date[]): number {
  const days = new Set(createdAts.map((d) => dayKey(d)));
  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  return streak;
}

function bucketWeeklyMinutes(
  timed: { startAt: Date; endAt: Date }[],
  weeks: number,
) {
  const now = Date.now();
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const weeksAgo = weeks - 1 - i;
    const weekEnd = now - weeksAgo * 7 * DAY_MS;
    const weekStart = weekEnd - 7 * DAY_MS;
    return { weekStart: new Date(weekStart), weekEnd: new Date(weekEnd), minutes: 0 };
  });
  for (const { startAt, endAt } of timed) {
    const ms = Math.max(0, endAt.getTime() - startAt.getTime());
    const bucket = buckets.find(
      (b) => startAt.getTime() >= b.weekStart.getTime() && startAt.getTime() < b.weekEnd.getTime(),
    );
    if (bucket) bucket.minutes += ms / 60_000;
  }
  return buckets.map((b) => ({
    weekStart: b.weekStart.toISOString().slice(0, 10),
    minutes: Math.round(b.minutes),
  }));
}

async function withAvatarUrl<T extends { avatarKey: string | null }>(
  user: T,
): Promise<Omit<T, "avatarKey"> & { avatarUrl: string | null }> {
  const { avatarKey, ...rest } = user;
  const avatarUrl = avatarKey ? await getPresignedGetUrl(avatarKey, { expiresIn: 3600 }) : null;
  return { ...rest, avatarUrl };
}

export const getMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const [
    user,
    totalInterviews,
    timedInterviews,
    scoreAgg,
    scoredInterviews,
    latestAnalysis,
    typeCounts,
    skillCounts,
    allInterviewDates,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        avatarKey: true,
        provider: true,
        createdAt: true,
        resumeStatus: true,
        resumeError: true,
        summary: true,
      },
    }),
    prisma.interview.count({ where: { userId } }),
    prisma.interview.findMany({
      where: { userId, startAt: { not: null }, endAt: { not: null } },
      select: { startAt: true, endAt: true },
    }),
    prisma.result.aggregate({
      where: { interview: { userId } },
      _max: { score: true },
      _avg: { score: true },
    }),
    prisma.interview.findMany({
      where: { userId, result: { isNot: null } },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { createdAt: true, result: { select: { score: true } } },
    }),
    prisma.resumeAnalysis.findFirst({
      where: { userId, overallScore: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { name: true, overallScore: true, createdAt: true },
    }),
    prisma.interview.groupBy({ by: ["type"], where: { userId }, _count: true }),
    prisma.interview.groupBy({ by: ["skill"], where: { userId }, _count: true }),
    prisma.interview.findMany({ where: { userId }, select: { createdAt: true } }),
  ]);

  if (!user) throw new AppError(404, "UserNotFound");

  const minutesPracticed = Math.round(
    timedInterviews.reduce((sum, i) => sum + Math.max(0, i.endAt!.getTime() - i.startAt!.getTime()), 0) / 60_000,
  );

  const { avatarUrl, ...identity } = await withAvatarUrl(user);

  res.status(200).json({
    success: true,
    message: "Profile fetched",
    data: {
      ...identity,
      avatarUrl,
      joinedAt: identity.createdAt,
      stats: {
        totalInterviews,
        minutesPracticed,
        avgScore: scoreAgg._avg.score ?? null,
        bestScore: scoreAgg._max.score ?? null,
        currentStreak: computeStreak(allInterviewDates.map((i) => i.createdAt)),
      },
      resume: latestAnalysis
        ? {
            name: latestAnalysis.name,
            overallScore: latestAnalysis.overallScore,
            analyzedAt: latestAnalysis.createdAt,
          }
        : null,
      weeklyPractice: bucketWeeklyMinutes(
        timedInterviews as { startAt: Date; endAt: Date }[],
        8,
      ),
      scoreTrend: scoredInterviews.map((i) => ({
        date: i.createdAt.toISOString(),
        score: i.result!.score,
      })),
      typeDistribution: typeCounts.map((t) => ({ type: t.type, count: t._count })),
      skillDistribution: skillCounts.map((s) => ({ skill: s.skill, count: s._count })),
    },
  });
};

const updateProfileSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Username must be 3-24 characters: letters, numbers, underscore")
    .optional(),
});

export const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const { success, data } = updateProfileSchema.safeParse(req.body);
  if (!success) throw new AppError(400, "InvalidProfileData");

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.username !== undefined ? { username: data.username } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarKey: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: await withAvatarUrl(user),
    });
  } catch (err: any) {
    if (err?.code === "P2002") throw new AppError(409, "UsernameTaken");
    throw err;
  }
};

export const uploadMyAvatar = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const file = req.file;
  if (!file) throw new AppError(400, "AvatarRequired");

  const ext = path.extname(file.originalname) || ".jpg";
  const key = `users/${userId}/avatar/avatar${ext}`;

  const upload = await uploadToBucket(key, file.buffer, file.size, file.mimetype);
  if (!upload.success) throw new AppError(502, "Failed to store avatar");

  await prisma.user.update({ where: { id: userId }, data: { avatarKey: key } });
  const avatarUrl = await getPresignedGetUrl(key, { expiresIn: 3600 });

  res.status(200).json({
    success: true,
    message: "Avatar updated",
    data: { avatarUrl },
  });
};

export const uploadMyResume = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const file = req.file;
  if (!file) throw new AppError(400, "ResumeRequired");

  const ext = path.extname(file.originalname) || ".pdf";
  const s3key = `users/${userId}/profile-resume/resume${ext}`;

  await prisma.user.update({
    where: { id: userId },
    data: { resumeStatus: "PARSING", resumeError: null },
  });
  await enqueueProfileResume({ userId, s3key }, file.path, file.size);

  res.status(202).json({
    success: true,
    message: "Resume uploaded, parsing started",
    data: { status: "PARSING" },
  });
};

export const getPublicProfile = async (req: Request, res: Response) => {
  const username = req.params.username as string;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      displayName: true,
      bio: true,
      avatarKey: true,
      createdAt: true,
      summary: true,
    },
  });
  if (!user) throw new AppError(404, "UserNotFound");

  const rawSummary = user.summary as unknown as ParsedSummary | null;
  const publicSummary: ParsedSummary | null = rawSummary
    ? { ...rawSummary, email: null, phone: null }
    : null;

  const publicInterviews = await prisma.interview.findMany({
    where: { user: { username }, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      jobRole: true,
      skill: true,
      experience: true,
      type: true,
      createdAt: true,
      recordingStatus: true,
      recordingDurationMs: true,
    },
  });

  const { avatarUrl, ...identity } = await withAvatarUrl(user);

  res.status(200).json({
    success: true,
    message: "Public profile fetched",
    data: {
      ...identity,
      avatarUrl,
      joinedAt: identity.createdAt,
      summary: publicSummary,
      interviews: publicInterviews,
    },
  });
};

export const getPublicInterview = async (req: Request, res: Response) => {
  const { username, interviewId } = req.params as { username: string; interviewId: string };

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, user: { username } },
    select: {
      jobRole: true,
      skill: true,
      experience: true,
      type: true,
      createdAt: true,
      recordingStatus: true,
      recordingDurationMs: true,
      recordingKey: true,
      isPublic: true,
      userId: true,
      user: { select: { username: true, displayName: true, avatarKey: true } },
    },
  });
  // The owner keeps access after switching it private, so they can switch it back.
  const isOwner = Boolean(req.userId) && interview?.userId === req.userId;
  if (!interview || (!interview.isPublic && !isOwner)) throw new AppError(404, "InterviewNotFound");

  const [recordingUrl, avatarUrl, totalInterviews, timedInterviews] = await Promise.all([
    interview.recordingStatus === "READY" && interview.recordingKey
      ? getPresignedGetUrl(interview.recordingKey, { expiresIn: 3600 })
      : Promise.resolve(null),
    interview.user.avatarKey
      ? getPresignedGetUrl(interview.user.avatarKey, { expiresIn: 3600 })
      : Promise.resolve(null),
    prisma.interview.count({ where: { userId: interview.userId } }),
    prisma.interview.findMany({
      where: { userId: interview.userId, startAt: { not: null }, endAt: { not: null } },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const minutesPracticed = Math.round(
    timedInterviews.reduce((sum, i) => sum + Math.max(0, i.endAt!.getTime() - i.startAt!.getTime()), 0) / 60_000,
  );

  res.status(200).json({
    success: true,
    message: "Public interview fetched",
    data: {
      jobRole: interview.jobRole,
      skill: interview.skill,
      experience: interview.experience,
      type: interview.type,
      createdAt: interview.createdAt,
      recordingStatus: interview.recordingStatus,
      durationMs: interview.recordingDurationMs,
      recordingUrl,
      isPublic: interview.isPublic,
      isOwner,
      owner: {
        username: interview.user.username,
        displayName: interview.user.displayName,
        avatarUrl,
        totalInterviews,
        minutesPracticed,
      },
    },
  });
};
