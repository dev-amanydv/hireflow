
import type {
  Check,
  CheckStatus,
  CategoryScore,
  ParsedSummary,
  RuleInput,
} from "./types";

const STRONG_VERBS = new Set([
  "built",
  "designed",
  "developed",
  "led",
  "shipped",
  "launched",
  "created",
  "implemented",
  "architected",
  "reduced",
  "improved",
  "increased",
  "optimized",
  "automated",
  "migrated",
  "scaled",
  "delivered",
  "drove",
  "owned",
  "spearheaded",
  "engineered",
  "refactored",
  "integrated",
  "deployed",
  "cut",
  "grew",
  "accelerated",
  "streamlined",
  "resolved",
  "debugged",
  "mentored",
  "orchestrated",
]);

const WEAK_PHRASES = [
  "responsible for",
  "worked on",
  "helped with",
  "duties included",
  "tasked with",
  "team player",
  "hard worker",
  "hard-working",
  "detail oriented",
  "detail-oriented",
  "go-getter",
  "synergy",
  "think outside the box",
  "results-driven",
  "self-starter",
];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/[a-z0-9/_-]+/i;
const GITHUB_RE = /github\.com\/[a-z0-9/_-]+/i;

function check(
  id: string,
  label: string,
  status: CheckStatus,
  points: number,
  maxPoints: number,
  detail: string,
  evidence?: string,
): Check {
  return { id, label, status, points, maxPoints, detail, evidence };
}

function scoreOf(checks: Check[]): number {
  const max = checks.reduce((s, c) => s + c.maxPoints, 0);
  if (max === 0) return 0;
  const earned = checks.reduce((s, c) => s + c.points, 0);
  return Math.round((earned / max) * 100);
}

function present(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function collectBullets(summary: ParsedSummary | null): string[] {
  if (!summary) return [];
  const out: string[] = [];
  for (const e of summary.experience ?? []) {
    for (const w of e.work ?? []) if (present(w)) out.push(w.trim());
  }
  for (const p of summary.projects ?? []) {
    for (const a of p.about ?? []) if (present(a)) out.push(a.trim());
    for (const r of p.readmeSummary ?? []) if (present(r)) out.push(r.trim());
  }
  return out;
}

function firstWord(s: string): string {
  const m = s
    .trim()
    .toLowerCase()
    .match(/[a-z]+/);
  return m ? m[0] : "";
}


export function parseabilityChecks(input: RuleInput): Check[] {
  const text = input.rawText ?? "";
  const words = text.split(/\s+/).filter(Boolean).length;
  const checks: Check[] = [];
  checks.push(
    text.trim().length >= 600
      ? check("extractable-text", "Text is machine-readable", "pass", 3, 3, "The PDF exposed a healthy amount of selectable text.")
      : text.trim().length >= 200
        ? check("extractable-text", "Text is machine-readable", "warn", 1, 3, "Little extractable text — the layout may be image-heavy or use uncommon fonts.")
        : check("extractable-text", "Text is machine-readable", "fail", 0, 3, "Almost no extractable text. This looks scanned/image-based and most ATS will read it as blank."),
  );

  checks.push(
    !input.usedOcr
      ? check("no-ocr", "Not a scanned document", "pass", 2, 2, "Text was read directly, not via OCR.")
      : check("no-ocr", "Not a scanned document", "warn", 0, 2, "Text needed OCR — export a text-based PDF instead of a scan."),
  );

  const wordStatus: CheckStatus =
    words >= 300 && words <= 1000 ? "pass" : words >= 200 && words <= 1300 ? "warn" : "fail";
  checks.push(
    check(
      "word-count",
      "Reasonable length",
      wordStatus,
      wordStatus === "pass" ? 2 : wordStatus === "warn" ? 1 : 0,
      2,
      `Resume is ~${words} words. One page (~350–700 words) parses and reads best for most roles.`,
    ),
  );

  const bad = (text.match(/�/g) || []).length;
  checks.push(
    bad === 0
      ? check("encoding", "Clean character encoding", "pass", 1, 1, "No garbled/replacement characters detected.")
      : check("encoding", "Clean character encoding", "warn", 0, 1, `Found ${bad} unreadable characters — a sign of a broken text layer.`),
  );

  return checks;
}

export function contactChecks(input: RuleInput): Check[] {
  const text = input.rawText ?? "";
  const s = input.summary;
  const has = (re: RegExp, field?: string | null) => re.test(text) || present(field);

  const email = has(EMAIL_RE, s?.email);
  const phone = has(PHONE_RE, s?.phone);
  const linkedin = has(LINKEDIN_RE, s?.linkedIn);
  const github = has(GITHUB_RE, s?.github);
  const name = present(s?.name);

  return [
    email
      ? check("email", "Email present", "pass", 3, 3, "A contact email was found.")
      : check("email", "Email present", "fail", 0, 3, "No email detected. Recruiters and ATS both key off this."),
    phone
      ? check("phone", "Phone present", "pass", 2, 2, "A phone number was found.")
      : check("phone", "Phone present", "warn", 0, 2, "No phone number detected."),
    linkedin
      ? check("linkedin", "LinkedIn present", "pass", 2, 2, "A LinkedIn profile link was found.")
      : check("linkedin", "LinkedIn present", "warn", 0, 2, "No LinkedIn link — most recruiters expect one."),
    github
      ? check("github", "GitHub / portfolio present", "pass", 1, 1, "A GitHub/portfolio link was found.")
      : check("github", "GitHub / portfolio present", "warn", 0, 1, "No GitHub or portfolio link detected."),
    name
      ? check("name", "Name detected", "pass", 1, 1, "A candidate name was parsed.")
      : check("name", "Name detected", "warn", 0, 1, "Could not confidently parse a name."),
  ];
}

const SECTION_PATTERNS: { id: string; label: string; re: RegExp; corroborate: (s: ParsedSummary | null) => boolean }[] = [
  { id: "experience", label: "Experience", re: /\b(experience|employment|work history)\b/i, corroborate: (s) => (s?.experience?.length ?? 0) > 0 },
  { id: "education", label: "Education", re: /\beducation\b/i, corroborate: (s) => (s?.education?.length ?? 0) > 0 },
  { id: "skills", label: "Skills", re: /\b(skills|technologies|tech stack)\b/i, corroborate: (s) => (s?.technicalSkills?.length ?? 0) > 0 },
  { id: "projects", label: "Projects", re: /\bprojects?\b/i, corroborate: (s) => (s?.projects?.length ?? 0) > 0 },
  { id: "summary", label: "Summary / objective", re: /\b(summary|objective|about)\b/i, corroborate: (s) => present(s?.summary) },
];

export function structureChecks(input: RuleInput): Check[] {
  const text = input.rawText ?? "";
  return SECTION_PATTERNS.map((sec) => {
    const inText = sec.re.test(text);
    const corroborated = sec.corroborate(input.summary);
    const found = inText || corroborated;
    const max = sec.id === "experience" || sec.id === "skills" ? 2 : 1;
    return found
      ? check(`section-${sec.id}`, `${sec.label} section`, "pass", max, max, `A ${sec.label.toLowerCase()} section was detected.`)
      : check(`section-${sec.id}`, `${sec.label} section`, sec.id === "summary" ? "warn" : "fail", 0, max, `No ${sec.label.toLowerCase()} section detected. ATS parsers rely on standard headings.`);
  });
}

export function impactChecks(input: RuleInput): Check[] {
  const bullets = collectBullets(input.summary);
  const total = bullets.length;

  if (total === 0) {
    return [
      check("impact-none", "Accomplishment bullets", "fail", 0, 8, "No accomplishment bullets could be parsed from experience or projects."),
    ];
  }

  const quantified = bullets.filter((b) => /\d/.test(b) || /[%$]/.test(b)).length;
  const strong = bullets.filter((b) => STRONG_VERBS.has(firstWord(b))).length;
  const weakHits = bullets.filter((b) => WEAK_PHRASES.some((p) => b.toLowerCase().includes(p)));
  const firstPerson = bullets.filter((b) => /\b(i|me|my|myself)\b/i.test(b)).length;

  const qRatio = quantified / total;
  const sRatio = strong / total;

  const qStatus: CheckStatus = qRatio >= 0.3 ? "pass" : qRatio >= 0.1 ? "warn" : "fail";
  const sStatus: CheckStatus = sRatio >= 0.5 ? "pass" : sRatio >= 0.25 ? "warn" : "fail";
  const wStatus: CheckStatus = weakHits.length === 0 ? "pass" : weakHits.length <= 2 ? "warn" : "fail";
  const fpStatus: CheckStatus = firstPerson === 0 ? "pass" : firstPerson <= 2 ? "warn" : "fail";

  return [
    check(
      "quantified",
      "Quantified impact",
      qStatus,
      qStatus === "pass" ? 3 : qStatus === "warn" ? 1 : 0,
      3,
      `${quantified} of ${total} bullets include a metric (%, $, or number). Aim for roughly a third.`,
      weakHits[0],
    ),
    check(
      "action-verbs",
      "Strong action verbs",
      sStatus,
      sStatus === "pass" ? 3 : sStatus === "warn" ? 1 : 0,
      3,
      `${strong} of ${total} bullets open with a strong action verb.`,
    ),
    check(
      "weak-phrases",
      "Free of filler phrases",
      wStatus,
      wStatus === "pass" ? 1 : wStatus === "warn" ? 0.5 : 0,
      1,
      weakHits.length === 0 ? "No filler phrases detected." : `Filler detected: "${weakHits[0]}".`,
      weakHits[0],
    ),
    check(
      "first-person",
      "Third-person voice",
      fpStatus,
      fpStatus === "pass" ? 1 : fpStatus === "warn" ? 0.5 : 0,
      1,
      firstPerson === 0 ? "No first-person pronouns — the resume convention." : `${firstPerson} bullets use "I/me/my". Drop the pronouns.`,
    ),
  ];
}

export function runRules(input: RuleInput): Omit<CategoryScore, "weight">[] {
  const parse = parseabilityChecks(input);
  const contact = contactChecks(input);
  const structure = structureChecks(input);
  const impact = impactChecks(input);

  return [
    { category: "parseability", label: "ATS parseability", score: scoreOf(parse), checks: parse },
    { category: "contact", label: "Contact & essentials", score: scoreOf(contact), checks: contact },
    { category: "structure", label: "Section structure", score: scoreOf(structure), checks: structure },
    { category: "impact", label: "Impact & writing", score: scoreOf(impact), checks: impact },
  ];
}
