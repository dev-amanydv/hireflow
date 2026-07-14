

import type {
  AnalysisReport,
  AnalysisTarget,
  CategoryId,
  CategoryScore,
  Check,
  Finding,
  Severity,
} from "./types";
import type { JudgeResult } from "./judge";

export const WEIGHTS: Record<CategoryId, number> = {
  parseability: 0.2,
  contact: 0.1,
  structure: 0.1,
  impact: 0.2,
  keywords: 0.25,
  content: 0.15,
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, important: 1, minor: 2 };

function findingsFromChecks(categories: Omit<CategoryScore, "weight">[]): Finding[] {
  const out: Finding[] = [];
  for (const cat of categories) {
    for (const c of cat.checks) {
      if (c.status === "pass") continue;
      out.push({
        severity: c.status === "fail" ? "important" : "minor",
        category: cat.label,
        title: c.label,
        evidence: c.evidence ?? "",
        suggestion: c.detail,
      });
    }
  }
  return out;
}

function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function buildReport(
  ruleCategories: Omit<CategoryScore, "weight">[],
  judge: JudgeResult,
  target: AnalysisTarget,
): AnalysisReport {
  const categories: CategoryScore[] = ruleCategories.map((c) => ({
    ...c,
    weight: WEIGHTS[c.category],
  }));

  if (judge.available && judge.content) {
    const contentScore = Math.round(
      (judge.content.relevance + judge.content.impactQuality + judge.content.seniorityFit) / 3,
    );
    categories.push({
      category: "keywords",
      label: "Keyword & skills match",
      score: judge.keywords?.coverage ?? 0,
      weight: WEIGHTS.keywords,
      checks: [] as Check[],
      summary: judge.keywords
        ? `${judge.keywords.matched.length} expected skills matched, ${judge.keywords.missing.length} missing.`
        : undefined,
    });
    categories.push({
      category: "content",
      label: "Content quality & fit",
      score: contentScore,
      weight: WEIGHTS.content,
      checks: [] as Check[],
      summary: judge.content.summary,
    });
  }

  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const overallScore =
    totalWeight === 0
      ? 0
      : Math.round(categories.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight);

  const findings = sortFindings([...judge.findings, ...findingsFromChecks(ruleCategories)]);

  return {
    overallScore,
    categories,
    findings,
    keyword: judge.keywords,
    target: { role: target.role, experience: target.experience, hasJd: Boolean(target.jdText) },
    weights: WEIGHTS,
    engine: {
      deterministic: "ats-rules-v1",
      judge: judge.available ? "azure/gpt-5-mini (langchain)" : "unavailable",
    },
    generatedAt: new Date().toISOString(),
  };
}
