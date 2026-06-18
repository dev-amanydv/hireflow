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
