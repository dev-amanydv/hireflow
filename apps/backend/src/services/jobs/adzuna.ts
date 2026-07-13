import type { JobAdapter, NormalizedJob } from "./types";
import { normalizeJobType } from "./types";

interface AdzunaJob {
  id: string;
  title?: string | null;
  company?: { display_name?: string | null } | null;
  location?: { display_name?: string | null } | null;
  description?: string | null;
  redirect_url: string;
  created?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  contract_time?: string | null;
  contract_type?: string | null;
  category?: { label?: string | null; tag?: string | null } | null;
}

function looksRemote(text: string): boolean {
  return /\bremote\b|work from home|wfh/i.test(text);
}

export const adzunaAdapter: JobAdapter = {
  source: "ADZUNA",
  async fetch(): Promise<NormalizedJob[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];

    const country = process.env.ADZUNA_COUNTRY ?? "gb";
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "50",
      what: "software engineer",
      "content-type": "application/json",
    });
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Adzuna fetch failed: ${res.status}`);
    }
    const body = (await res.json()) as { results?: AdzunaJob[] };
    const jobs = body.results ?? [];

    return jobs.map((j) => {
      const description = j.description ?? "";
      return {
        source: "ADZUNA" as const,
        externalId: String(j.id),
        title: j.title ?? "Untitled role",
        company: j.company?.display_name ?? "Unknown",
        companyLogo: null,
        location: j.location?.display_name ?? null,
        remote: looksRemote(`${j.title ?? ""} ${description}`),
        jobType: normalizeJobType(j.contract_time ?? j.contract_type),
        category: j.category?.label ?? null,
        description,
        tags: j.category?.tag ? [j.category.tag] : [],
        salaryMin: j.salary_min ?? null,
        salaryMax: j.salary_max ?? null,
        salaryCurrency: null,
        url: j.redirect_url,
        postedAt: j.created ? new Date(j.created) : null,
      };
    });
  },
};
