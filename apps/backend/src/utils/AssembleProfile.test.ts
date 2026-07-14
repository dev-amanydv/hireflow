import { test, expect, describe } from "vitest";
import { assembleProfile } from "./AssembleProfile";
import type { GithubContent } from "./FetchGithub";
import type { SiteContent } from "./FetchSite";
import type { JobMeta } from "../queues/queue";

function githubResult(over: Partial<GithubContent> = {}): GithubContent {
  return { kind: "github", ok: true, url: "https://github.com/dev-amanydv", repos: [], ...over };
}

function siteResult(over: Partial<SiteContent> = {}): SiteContent {
  return { kind: "site", ok: true, url: "https://example.com", ...over };
}

const META: JobMeta = { resumeId: "resume-1", s3key: "s3/key", interviewId: "interview-1" };

describe("assembleProfile", () => {
  test("partitions mixed results into githubSources and siteSources", () => {
    const gh = githubResult();
    const site = siteResult();
    const result = assembleProfile("raw text", META, [gh, site]);

    expect(result.githubSources).toEqual([gh]);
    expect(result.siteSources).toEqual([site]);
  });

  test("preserves the raw resume text verbatim", () => {
    const result = assembleProfile("some extracted resume text", META, []);
    expect(result.rawResumeText).toBe("some extracted resume text");
  });

  test("empty child results -> empty source arrays", () => {
    const result = assembleProfile("", META, []);
    expect(result.githubSources).toEqual([]);
    expect(result.siteSources).toEqual([]);
  });

  test("always reports usedOcr as false regardless of input", () => {
    // Note: assembleProfile hard-codes usedOcr to false and never threads through
    // any OCR signal from the caller — this looks like a real gap (OCR-derived
    // text would silently be scored as if it were clean extractable text).
    const result = assembleProfile("text", META, []);
    expect(result.usedOcr).toBe(false);
  });

  test("multiple github and site sources are all preserved in order", () => {
    const gh1 = githubResult({ url: "https://github.com/a" });
    const gh2 = githubResult({ url: "https://github.com/b" });
    const site1 = siteResult({ url: "https://a.com" });

    const result = assembleProfile("text", META, [gh1, site1, gh2]);

    expect(result.githubSources).toEqual([gh1, gh2]);
    expect(result.siteSources).toEqual([site1]);
  });
});
