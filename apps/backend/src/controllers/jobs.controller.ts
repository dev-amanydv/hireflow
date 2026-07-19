import z from "zod";
import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../prisma/db";
import { Prisma } from "../generated/prisma/client";

const listJobsSchema = z.object({
  q: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  remote: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "OTHER"]).optional(),
  source: z.enum(["REMOTIVE", "ARBEITNOW", "ADZUNA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const listJobs = async (req: Request, res: Response) => {
  const parsed = listJobsSchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, "InvalidJobQuery");
  const { q, location, remote, type, source, page, pageSize } = parsed.data;

  const where: Prisma.JobWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (remote !== undefined) where.remote = remote;
  if (type) where.jobType = type;
  if (source) where.source = source;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { postedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: "Jobs fetched",
    data: { jobs, total, page, pageSize },
  });
};

const jobIdSchema = z.object({ id: z.string().uuid() });

export const listSavedJobs = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");
  const saved = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { job: true },
  });

  const jobs = saved.map((s) => s.job);

  res.status(200).json({
    success: true,
    message: "Saved jobs fetched",
    data: { jobs, total: jobs.length },
  });
};

export const saveJob = async (req: Request, res: Response) => {
  const parsed = jobIdSchema.safeParse(req.params);
  if (!parsed.success) throw new AppError(400, "InvalidJobId");
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");
  const jobId = parsed.data.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, "JobNotFound");

  const saved = await prisma.savedJob.upsert({
    where: { userId_jobId: { userId, jobId } },
    create: { userId, jobId },
    update: {},
  });

  res.status(200).json({
    success: true,
    message: "Job saved",
    data: { savedJob: saved },
  });
};

export const unsaveJob = async (req: Request, res: Response) => {
  const parsed = jobIdSchema.safeParse(req.params);
  if (!parsed.success) throw new AppError(400, "InvalidJobId");
  const userId = req.userId;
  if (!userId) throw new AppError(401, "Unauthorised");
  const jobId = parsed.data.id;

  await prisma.savedJob.deleteMany({ where: { userId, jobId } });

  res.status(200).json({
    success: true,
    message: "Job removed",
    data: null,
  });
};
