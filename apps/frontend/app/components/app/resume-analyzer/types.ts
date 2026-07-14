
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
  weights: Record<string, number>;
  engine: { deterministic: string; judge: string };
  generatedAt: string;
}

export interface AnalysisRow {
  id: string;
  name: string;
  status: string;
  overallScore: number | null;
  report: AnalysisReport | null;
  targetRole: string | null;
  targetExperience: string | null;
  targetJobId: string | null;
  error: string | null;
  createdAt: string;
}

export interface AnalysisListItem {
  id: string;
  name: string;
  status: string;
  overallScore: number | null;
  targetRole: string | null;
  createdAt: string;
}

export const ROLE_OPTIONS = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Mobile Engineer",
  "DevOps / SRE",
  "Data Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Designer",
  "Product Manager",
];

export const EXPERIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "staff", label: "Staff+" },
];
