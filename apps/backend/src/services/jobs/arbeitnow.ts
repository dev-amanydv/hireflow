import type { JobAdapter, NormalizedJob } from "./types";
import { normalizeJobType } from "./types";

const ENDPOINT = "https://www.arbeitnow.com/api/job-board-api";

const SWE_KEYWORDS = [
  "software",
  "developer",
  "engineer",
  "frontend",
  "backend",
  "full stack",
  "fullstack",
  "devops",
  "programmer",
  "react",
  "node",
  "python",
  "java",
  "golang",
  "typescript",
  "data engineer",
  "machine learning",
];

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description?: string | null;
  remote?: boolean | null;
  url: string;
  tags?: string[] | null;
  job_types?: string[] | null;
  location?: string | null;
  created_at?: number | null;
}

function isSoftwareRole(job: ArbeitnowJob): boolean {

  const title = job.title.toLowerCase();
  return SWE_KEYWORDS.some((kw) => title.includes(kw));
}

export const arbeitnowAdapter: JobAdapter = {
  source: "ARBEITNOW",
  async fetch(): Promise<NormalizedJob[]> {
    const res = await fetch(ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Arbeitnow fetch failed: ${res.status}`);
    }
    const body = (await res.json()) as { data?: ArbeitnowJob[] };
    const jobs = (body.data ?? []).filter(isSoftwareRole);

    return jobs.map((j) => ({
      source: "ARBEITNOW" as const,
      externalId: j.slug,
      title: j.title,
      company: j.company_name,
      companyLogo: null,
      location: j.location ?? null,
      remote: Boolean(j.remote),
      jobType: normalizeJobType(j.job_types?.[0]),
      category: null,
      description: j.description ?? "",
      tags: j.tags ?? [],
      url: j.url,
      postedAt: j.created_at ? new Date(j.created_at * 1000) : null,
    }));
  },
};
