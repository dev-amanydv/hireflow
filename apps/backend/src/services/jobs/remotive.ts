import type { JobAdapter, NormalizedJob } from "./types";
import { normalizeJobType } from "./types";

const ENDPOINT = "https://remotive.com/api/remote-jobs?category=software-dev";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string | null;
  category?: string | null;
  tags?: string[] | null;
  job_type?: string | null;
  publication_date?: string | null;
  candidate_required_location?: string | null;
  description?: string | null;
}

export const remotiveAdapter: JobAdapter = {
  source: "REMOTIVE",
  async fetch(): Promise<NormalizedJob[]> {
    const res = await fetch(ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Remotive fetch failed: ${res.status}`);
    }
    const body = (await res.json()) as { jobs?: RemotiveJob[] };
    const jobs = body.jobs ?? [];

    return jobs.map((j) => ({
      source: "REMOTIVE" as const,
      externalId: String(j.id),
      title: j.title,
      company: j.company_name,
      companyLogo: j.company_logo ?? null,
      location: j.candidate_required_location ?? null,
      remote: true,
      jobType: normalizeJobType(j.job_type),
      category: j.category ?? null,
      description: j.description ?? "",
      tags: j.tags ?? [],
      url: j.url,
      postedAt: j.publication_date ? new Date(j.publication_date) : null,
    }));
  },
};
