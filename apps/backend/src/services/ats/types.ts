
export type CheckStatus = "pass" | "warn" | "fail";

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  points: number; 
  maxPoints: number;
  detail: string; 
  evidence?: string;
}

export type CategoryId =
  | "parseability"
  | "contact"
  | "structure"
  | "impact"
  | "keywords"
  | "content";

export interface CategoryScore {
  category: CategoryId;
  label: string;
  score: number; 
  weight: number;
  checks: Check[]; 
  summary?: string;
}

export type Severity = "critical" | "important" | "minor";

export interface Finding {
  severity: Severity;
  category: string;
  title: string;
  evidence: string;
  suggestion: string;
  before?: string;
  after?: string; 
}

export interface KeywordMatch {
  matched: string[];
  missing: string[];
  coverage: number;
}

export interface AnalysisReport {
  overallScore: number; 
  categories: CategoryScore[];
  findings: Finding[];
  keyword: KeywordMatch | null;
  target: { role: string | null; experience: string | null; hasJd: boolean };
  weights: Record<CategoryId, number>;
  engine: { deterministic: string; judge: string };
  generatedAt: string;
}

export interface ParsedSummary {
  name: string | null;
  role: string | null;
  summary: string | null;
  yearOfExp: string | null;
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

export interface RuleInput {
  rawText: string;
  usedOcr: boolean;
  summary: ParsedSummary | null;
}

export interface AnalysisTarget {
  role: string | null;
  experience: string | null;
  jdText: string | null;
}
