import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";

// Aggregates the signed-in user's activity for the Overview dashboard: interview
// counts, minutes practiced (derived from startAt/endAt), score high/average, saved
// jobs, latest resume ATS score, and a short list of recent interviews shaped like
// GET /interview/list so the frontend can reuse the same row component.
export const getDashboardOverview = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");

  const [
    totalInterviews,
    timedInterviews,
    scoreAgg,
    recentScored,
    savedJobs,
    latestAnalysis,
    recentInterviews,
  ] = await Promise.all([
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
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { result: { select: { score: true } } },
    }),
    prisma.savedJob.count({ where: { userId } }),
    prisma.resumeAnalysis.findFirst({
      where: { userId, overallScore: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true },
    }),
    prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
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
    }),
  ]);

  const minutesPracticed = Math.round(
    timedInterviews.reduce((sum, i) => {
      const ms = i.endAt!.getTime() - i.startAt!.getTime();
      return sum + Math.max(0, ms);
    }, 0) / 60_000,
  );

  const lastScoreDelta =
    recentScored.length === 2 && recentScored[0]?.result && recentScored[1]?.result
      ? recentScored[0].result.score - recentScored[1].result.score
      : null;

  res.status(200).json({
    success: true,
    message: "Dashboard overview fetched",
    data: {
      totalInterviews,
      minutesPracticed,
      bestScore: scoreAgg._max.score ?? null,
      avgScore: scoreAgg._avg.score ?? null,
      lastScoreDelta,
      savedJobs,
      latestAtsScore: latestAnalysis?.overallScore ?? null,
      recent: recentInterviews.map((i) => ({
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
