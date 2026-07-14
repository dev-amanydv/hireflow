import type { JobSource, JobType } from "../../generated/prisma/client";

export interface NormalizedJob {
  source: JobSource;
  externalId: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location?: string | null;
  remote: boolean;
  jobType: JobType;
  category?: string | null;
  description: string;
  tags: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  url: string;
  postedAt?: Date | null;
}

export interface JobAdapter {
  source: JobSource;
  fetch(): Promise<NormalizedJob[]>;
}

export function normalizeJobType(raw?: string | null): JobType {
  if (!raw) return "OTHER";
  const v = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (v.includes("intern")) return "INTERNSHIP";
  if (v.includes("parttime")) return "PART_TIME";
  if (v.includes("contract") || v.includes("freelance") || v.includes("temporary"))
    return "CONTRACT";
  if (v.includes("fulltime")) return "FULL_TIME";
  return "OTHER";
}
