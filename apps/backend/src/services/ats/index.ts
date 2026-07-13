
import { runRules } from "./rules";
import { judgeResume } from "./judge";
import { buildReport } from "./composite";
import type { AnalysisReport, AnalysisTarget, ParsedSummary } from "./types";

export * from "./types";
export { WEIGHTS } from "./composite";

export async function analyzeResume(args: {
  rawText: string;
  usedOcr: boolean;
  summary: ParsedSummary | null;
  target: AnalysisTarget;
}): Promise<AnalysisReport> {
  const ruleCategories = runRules({
    rawText: args.rawText,
    usedOcr: args.usedOcr,
    summary: args.summary,
  });
  const judge = await judgeResume(args.summary, args.rawText, args.target);
  return buildReport(ruleCategories, judge, args.target);
}
