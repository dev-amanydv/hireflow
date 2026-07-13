import { test, expect, describe } from "bun:test";
import {
  runRules,
  contactChecks,
  impactChecks,
  parseabilityChecks,
  structureChecks,
  collectBullets,
} from "./rules";
import type { ParsedSummary, RuleInput } from "./types";

function summary(over: Partial<ParsedSummary> = {}): ParsedSummary {
  return {
    name: "Aman Yadav",
    role: "Full-Stack Engineer",
    summary: "Engineer with production experience.",
    yearOfExp: "<3 year",
    email: "ay@example.com",
    linkedIn: "https://linkedin.com/in/devamanydv",
    github: "https://github.com/dev-amanydv",
    phone: "+91 8107595366",
    technicalSkills: [{ name: "TypeScript", usedIn: null }],
    experience: [
      {
        role: "Engineer",
        company: "Acme",
        duration: "2024-2025",
        work: [
          "Reduced API latency by 50% across the checkout service",
          "Built a real-time notification pipeline handling 12k req/s",
        ],
      },
    ],
    projects: [
      { name: "SyncSides", skills: ["WebRTC"], readmeSummary: ["Low-latency video"], about: ["Automated FFmpeg merging"] },
    ],
    education: [{ qualification: "B.Tech CSE", institution: "GEC", startingYear: "2024" }],
    ...over,
  };
}

const RICH_TEXT = `Aman Yadav
Full-Stack Engineer
Experience
Skills
Education
Projects
Summary
${"lorem ipsum ".repeat(80)}`;

function input(over: Partial<RuleInput> = {}): RuleInput {
  return { rawText: RICH_TEXT, usedOcr: false, summary: summary(), ...over };
}

describe("determinism (the trust anchor)", () => {
  test("identical input produces byte-identical output", () => {
    const a = JSON.stringify(runRules(input()));
    const b = JSON.stringify(runRules(input()));
    expect(a).toBe(b);
  });

  test("all four categories are produced with 0-100 scores", () => {
    const cats = runRules(input());
    expect(cats.map((c) => c.category).sort()).toEqual([
      "contact",
      "impact",
      "parseability",
      "structure",
    ]);
    for (const c of cats) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("contact checks", () => {
  test("full contact info -> email/phone/linkedin/github/name all pass", () => {
    const checks = contactChecks(input());
    for (const c of checks) expect(c.status).toBe("pass");
  });

  test("missing email -> fail; picked up from raw text when summary lacks it", () => {
    const noContact = contactChecks({
      rawText: "just some words with no contact details here",
      usedOcr: false,
      summary: summary({ email: null, phone: null, linkedIn: null, github: null }),
    });
    expect(noContact.find((c) => c.id === "email")?.status).toBe("fail");

    const fromText = contactChecks({
      rawText: "reach me at foo@bar.com",
      usedOcr: false,
      summary: summary({ email: null }),
    });
    expect(fromText.find((c) => c.id === "email")?.status).toBe("pass");
  });
});

describe("impact checks", () => {
  test("quantified, action-verb bullets score well", () => {
    const checks = impactChecks(input());
    expect(checks.find((c) => c.id === "quantified")?.status).toBe("pass");
    expect(checks.find((c) => c.id === "action-verbs")?.status).toBe("pass");
  });

  test("filler phrases and first person are penalised", () => {
    const weak = impactChecks(
      input({
        summary: summary({
          experience: [
            {
              role: "x",
              company: "y",
              duration: "z",
              work: [
                "Responsible for various tasks",
                "I worked on stuff and helped with things",
                "Team player and hard worker",
              ],
            },
          ],
          projects: [],
        }),
      }),
    );
    expect(weak.find((c) => c.id === "weak-phrases")?.status).not.toBe("pass");
    expect(weak.find((c) => c.id === "first-person")?.status).not.toBe("pass");
    expect(weak.find((c) => c.id === "quantified")?.status).toBe("fail");
  });

  test("no parseable bullets -> hard fail", () => {
    const none = impactChecks(input({ summary: summary({ experience: [], projects: [] }) }));
    expect(none[0]?.status).toBe("fail");
    expect(collectBullets(summary({ experience: [], projects: [] }))).toHaveLength(0);
  });
});

describe("parseability checks", () => {
  test("healthy text passes; near-empty text fails extractable-text", () => {
    expect(parseabilityChecks(input()).find((c) => c.id === "extractable-text")?.status).toBe("pass");
    const empty = parseabilityChecks({ rawText: "hi", usedOcr: false, summary: null });
    expect(empty.find((c) => c.id === "extractable-text")?.status).toBe("fail");
  });

  test("OCR usage warns", () => {
    const ocr = parseabilityChecks(input({ usedOcr: true }));
    expect(ocr.find((c) => c.id === "no-ocr")?.status).toBe("warn");
  });
});

describe("structure checks", () => {
  test("standard headings detected as pass", () => {
    const checks = structureChecks(input());
    for (const c of checks) expect(c.status).toBe("pass");
  });

  test("missing experience section fails when neither text nor summary corroborate", () => {
    const checks = structureChecks({
      rawText: "no standard headings here",
      usedOcr: false,
      summary: summary({ experience: [] }),
    });
    expect(checks.find((c) => c.id === "section-experience")?.status).toBe("fail");
  });
});
