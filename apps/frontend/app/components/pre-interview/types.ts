export interface RoleDetails {
  jobRole: string;
  type: "mixed" | "behavioural" | "technical" | "systemDesign";
  experience: "beginner" | "junior" | "mid" | "senior" | "staff";
}

export interface ResumeFile {
  name: string;
  size: string;
  parsed: boolean;
  skills: string[];
}

export interface SessionDetails {
  resume: ResumeFile;
  questions: number;
  duration: number;
}

export interface GithubProject {
  name: string;
  stars: number;
  language: string;
  description: string;
  included: boolean;
}

export interface CandidateProfile {
  fullName: string;
  location: string;
  title: string;
  years: string;
  headline: string;
  summary: string;
  github: string;
  linkedin: string;
  portfolio: string;
  skills: string[];
  projects: GithubProject[];
}

export interface ResumeSummary {
  name: string;
  role: string | null;
  summary: string | null;
  yearOfExp:
    | "fresher"
    | "<1 year"
    | "<3 year"
    | "<5 year"
    | "<10 year"
    | ">= 10 year"
    | null;
  email: string | null;
  linkedIn: string | null;
  github: string | null;
  phone: string | null;
  technicalSkills: { name: string | null; usedIn: string[] | null }[];
  experience: {
    role: string | null;
    company: string | null;
    duration: string | null;
    work: string[] | null;
  }[];
  projects: {
    name: string | null;
    skills: string[] | null;
    readmeSummary: string[] | null;
    about: string[] | null;
  }[];
  education: {
    qualification: string | null;
    institution: string | null;
    startingYear: string | null;
  }[];
}

function stripUrl(url: string | null): string {
  return url ? url.replace(/^https?:\/\//, "").replace(/\/+$/, "") : "";
}

export function summaryToCandidate(s: ResumeSummary): CandidateProfile {
  const skills = s.technicalSkills
    .map((t) => t.name)
    .filter((n): n is string => Boolean(n));

  return {
    fullName: s.name,
    location: "",
    title: s.role ?? "",
    years: s.yearOfExp ?? "",
    headline: [s.role, s.yearOfExp].filter(Boolean).join(" · "),
    summary: s.summary ?? "",
    github: stripUrl(s.github),
    linkedin: stripUrl(s.linkedIn),
    portfolio: "",
    skills,
    projects: s.projects.map((p) => ({
      name: p.name ?? "Untitled",
      stars: 0,
      language: p.skills?.[0] ?? "—",
      description: p.about?.[0] ?? p.readmeSummary?.[0] ?? "",
      included: true,
    })),
  };
}

export const EXPERIENCE_LABELS: Record<RoleDetails["experience"], string> = {
  beginner: "Beginner",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
};

export const FOCUS_LABELS: Record<RoleDetails["type"], string> = {
  mixed: "Mixed",
  behavioural: "Behavioural",
  technical: "Technical",
  systemDesign: "System Design",
};

export const MOCK_SESSION: SessionDetails = {
  resume: {
    name: "Aarav_Sharma_Resume.pdf",
    size: "248 KB · PDF",
    parsed: true,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS", "Docker"],
  },
  questions: 8,
  duration: 30,
};

export const MOCK_CANDIDATE: CandidateProfile = {
  fullName: "Aarav Sharma",
  location: "Bangalore, IN",
  title: "Backend Engineer",
  years: "4",
  headline: "Backend Engineer · 4 yrs · ex-Razorpay",
  summary:
    "Backend engineer with 4 years building high-throughput payment and notification systems. Strong in distributed systems, Postgres performance, and event-driven architecture. Led migration of a monolith to services handling 12k req/s.",
  github: "github.com/aaravsharma",
  linkedin: "linkedin.com/in/aaravsharma",
  portfolio: "aarav.dev",
  skills: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS", "Docker"],
  projects: [
    {
      name: "ledger-stream",
      stars: 312,
      language: "TypeScript",
      description:
        "Event-sourced double-entry ledger with idempotent writes and Kafka projections.",
      included: true,
    },
    {
      name: "pg-tune",
      stars: 148,
      language: "Go",
      description:
        "CLI that profiles Postgres workloads and suggests index + config changes.",
      included: true,
    },
    {
      name: "dotfiles",
      stars: 9,
      language: "Shell",
      description:
        "Personal shell + editor configuration. Excluded — not relevant to the role.",
      included: false,
    },
  ],
};
