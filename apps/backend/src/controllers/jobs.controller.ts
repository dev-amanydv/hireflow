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
