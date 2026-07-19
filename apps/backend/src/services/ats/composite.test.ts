import { test, expect, describe } from "vitest";
import { buildReport, WEIGHTS } from "./composite";
import type { JudgeResult } from "./judge";
import type { AnalysisTarget, CategoryScore, Check, Finding } from "./types";

function check(over: Partial<Check> = {}): Check {
  return {
    id: "check-1",
    label: "Some check",
    status: "pass",
    points: 10,
    maxPoints: 10,
    detail: "detail",
    ...over,
  };
}

function ruleCategory(over: Partial<Omit<CategoryScore, "weight">> = {}): Omit<CategoryScore, "weight"> {
  return {
    category: "parseability",
    label: "Parseability",
    score: 100,
    checks: [check()],
    ...over,
  };
}

function ruleCategories(): Omit<CategoryScore, "weight">[] {
  return [
    ruleCategory({ category: "parseability", label: "Parseability", score: 100 }),
    ruleCategory({ category: "contact", label: "Contact", score: 80 }),
    ruleCategory({ category: "structure", label: "Structure", score: 60 }),
    ruleCategory({ category: "impact", label: "Impact", score: 40 }),
  ];
}

function unavailableJudge(): JudgeResult {
  return { available: false, content: null, keywords: null, findings: [] };
}

function availableJudge(over: Partial<JudgeResult> = {}): JudgeResult {
  return {
    available: true,
    content: { relevance: 90, impactQuality: 60, seniorityFit: 30, summary: "solid fit" },
    keywords: { matched: ["React"], missing: ["Go"], coverage: 50 },
    findings: [],
    ...over,
  };
}

function target(over: Partial<AnalysisTarget> = {}): AnalysisTarget {
  return { role: "Backend Engineer", experience: "mid", jdText: null, ...over };
}

describe("buildReport — judge unavailable (deterministic-only degrade)", () => {
  test("only the four rule categories are included, each carrying its WEIGHTS weight", () => {
    const report = buildReport(ruleCategories(), unavailableJudge(), target());
    expect(report.categories).toHaveLength(4);
    for (const c of report.categories) {
      expect(c.weight).toBe(WEIGHTS[c.category]);
    }
  });

  test("overall score is the weight-normalized average of just those four categories", () => {
    const report = buildReport(ruleCategories(), unavailableJudge(), target());
    const expected = Math.round((100 * 0.2 + 80 * 0.1 + 60 * 0.1 + 40 * 0.2) / 0.6);
    expect(report.overallScore).toBe(expected);
  });

  test("engine.judge reports 'unavailable' and keyword is null", () => {
    const report = buildReport(ruleCategories(), unavailableJudge(), target());
    expect(report.engine.judge).toBe("unavailable");
    expect(report.engine.deterministic).toBe("ats-rules-v1");
    expect(report.keyword).toBeNull();
  });
});

describe("buildReport — judge available", () => {
  test("adds keywords and content categories with their own scores/weights", () => {
    const report = buildReport(ruleCategories(), availableJudge(), target());
    expect(report.categories).toHaveLength(6);

    const keywordsCat = report.categories.find((c) => c.category === "keywords");
    expect(keywordsCat?.score).toBe(50);
    expect(keywordsCat?.weight).toBe(WEIGHTS.keywords);
    expect(keywordsCat?.summary).toBe("1 expected skills matched, 1 missing.");

    const contentCat = report.categories.find((c) => c.category === "content");
    expect(contentCat?.score).toBe(Math.round((90 + 60 + 30) / 3));
    expect(contentCat?.weight).toBe(WEIGHTS.content);
    expect(contentCat?.summary).toBe("solid fit");
  });

  test("overall score folds in all six weighted categories", () => {
    const report = buildReport(ruleCategories(), availableJudge(), target());
    const contentScore = Math.round((90 + 60 + 30) / 3);
    const totalWeight = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
    const expected = Math.round(
      (100 * WEIGHTS.parseability +
        80 * WEIGHTS.contact +
        60 * WEIGHTS.structure +
        40 * WEIGHTS.impact +
        50 * WEIGHTS.keywords +
        contentScore * WEIGHTS.content) /
        totalWeight,
    );
    expect(report.overallScore).toBe(expected);
  });

  test("engine.judge names the azure/langchain model when available", () => {
    const report = buildReport(ruleCategories(), availableJudge(), target());
    expect(report.engine.judge).toBe("azure/gpt-5-mini (langchain)");
  });
});

describe("buildReport — general review (no target role, no JD)", () => {
  const generalJudge = () =>
    availableJudge({ keywords: { matched: [], missing: [], coverage: 0 } });
  const generalTarget = () => target({ role: null, jdText: null });

  test("keywords category is omitted rather than scored 0", () => {
    const report = buildReport(ruleCategories(), generalJudge(), generalTarget());
    expect(report.categories.find((c) => c.category === "keywords")).toBeUndefined();
    expect(report.categories).toHaveLength(5);
    expect(report.keyword).toBeNull();
  });

  test("the keywords weight is redistributed instead of dragging the score down", () => {
    const report = buildReport(ruleCategories(), generalJudge(), generalTarget());
    const contentScore = Math.round((90 + 60 + 30) / 3);
    const totalWeight =
      WEIGHTS.parseability + WEIGHTS.contact + WEIGHTS.structure + WEIGHTS.impact + WEIGHTS.content;
    const expected = Math.round(
      (100 * WEIGHTS.parseability +
        80 * WEIGHTS.contact +
        60 * WEIGHTS.structure +
        40 * WEIGHTS.impact +
        contentScore * WEIGHTS.content) /
        totalWeight,
    );
    expect(report.overallScore).toBe(expected);

    const ifScoredAsZero = Math.round(
      (100 * WEIGHTS.parseability +
        80 * WEIGHTS.contact +
        60 * WEIGHTS.structure +
        40 * WEIGHTS.impact +
        contentScore * WEIGHTS.content) /
        (totalWeight + WEIGHTS.keywords),
    );
    expect(report.overallScore).toBeGreaterThan(ifScoredAsZero);
  });

  test("a genuine 0% keyword match is still scored, not dropped", () => {
    const report = buildReport(
      ruleCategories(),
      availableJudge({ keywords: { matched: [], missing: ["Go", "Kafka"], coverage: 0 } }),
      target(),
    );
    const keywordsCat = report.categories.find((c) => c.category === "keywords");
    expect(keywordsCat?.score).toBe(0);
    expect(keywordsCat?.weight).toBe(WEIGHTS.keywords);
    expect(report.keyword).not.toBeNull();
  });

  test("target.role passes through as null", () => {
    const report = buildReport(ruleCategories(), generalJudge(), generalTarget());
    expect(report.target).toEqual({ role: null, experience: "mid", hasJd: false });
  });
});

describe("buildReport — findings", () => {
  test("non-pass checks become findings; fail -> important, warn -> minor", () => {
    const categories = [
      ruleCategory({
        category: "parseability",
        checks: [
          check({ id: "a", status: "fail", label: "Missing section", detail: "add it", evidence: "n/a" }),
          check({ id: "b", status: "warn", label: "OCR used", detail: "avoid ocr" }),
          check({ id: "c", status: "pass" }),
        ],
      }),
    ];
    const report = buildReport(categories, unavailableJudge(), target());
    expect(report.findings).toHaveLength(2);
    expect(report.findings.map((f) => f.severity).sort()).toEqual(["important", "minor"]);
  });

  test("findings are sorted critical > important > minor, judge findings included first-class", () => {
    const judgeFindings: Finding[] = [
      { severity: "minor", category: "Clarity", title: "minor issue", evidence: "", suggestion: "fix" },
      { severity: "critical", category: "Formatting", title: "critical issue", evidence: "", suggestion: "fix" },
    ];
    const categories = [
      ruleCategory({
        checks: [check({ status: "fail", label: "rule fail" })],
      }),
    ];
    const report = buildReport(categories, availableJudge({ findings: judgeFindings }), target());

    expect(report.findings.map((f) => f.severity)).toEqual(["critical", "important", "minor"]);
  });

  test("no findings when everything passes and judge has none", () => {
    const report = buildReport(ruleCategories(), unavailableJudge(), target());
    expect(report.findings).toEqual([]);
  });
});

describe("buildReport — target passthrough", () => {
  test("hasJd reflects whether jdText was supplied", () => {
    const withJd = buildReport(ruleCategories(), unavailableJudge(), target({ jdText: "some jd" }));
    expect(withJd.target).toEqual({ role: "Backend Engineer", experience: "mid", hasJd: true });

    const withoutJd = buildReport(ruleCategories(), unavailableJudge(), target({ jdText: null }));
    expect(withoutJd.target.hasJd).toBe(false);
  });

  test("generatedAt is a valid ISO timestamp", () => {
    const report = buildReport(ruleCategories(), unavailableJudge(), target());
    expect(() => new Date(report.generatedAt).toISOString()).not.toThrow();
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
  });
});

describe("buildReport — degenerate input", () => {
  test("empty rule categories with no judge -> zero total weight -> overallScore 0", () => {
    const report = buildReport([], unavailableJudge(), target());
    expect(report.overallScore).toBe(0);
    expect(report.categories).toEqual([]);
  });
});
