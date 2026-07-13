
import { AzureChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { z } from "zod";
import type {
  AnalysisTarget,
  Finding,
  KeywordMatch,
  ParsedSummary,
} from "./types";

export const JUDGE_MODEL_LABEL = "azure/gpt-5-mini (langchain)";

const judgeSchema = z.object({
  content: z.object({
    relevance: z.number().min(0).max(100).describe("How well the resume matches the target role/JD, 0-100"),
    impactQuality: z.number().min(0).max(100).describe("Quality and specificity of accomplishments, 0-100"),
    seniorityFit: z.number().min(0).max(100).describe("Alignment with the target experience level, 0-100"),
    summary: z.string().describe("2-3 sentence overall assessment"),
  }),
  keywords: z.object({
    matched: z.array(z.string()).describe("Skills/keywords the target expects that ARE present in the resume"),
    missing: z.array(z.string()).describe("Skills/keywords the target expects that are ABSENT from the resume"),
  }),
  findings: z
    .array(
      z.object({
        severity: z.enum(["critical", "important", "minor"]),
        category: z.string().describe("e.g. 'Impact', 'Keywords', 'Clarity', 'Formatting'"),
        title: z.string(),
        evidence: z.string().describe("The exact resume text this is about; empty string if about an omission"),
        suggestion: z.string(),
        before: z.string().nullable().describe("Original line to rewrite, or null"),
        after: z.string().nullable().describe("Concrete improved rewrite, or null"),
      }),
    )
    .describe("Ranked most-severe first; 4-8 items"),
});

export interface JudgeResult {
  available: boolean;
  content: z.infer<typeof judgeSchema>["content"] | null;
  keywords: KeywordMatch | null;
  findings: Finding[];
}

function getModel() {
  return new AzureChatOpenAI({
    model: process.env.OPENAI_TTT_MODEL,
    azureOpenAIApiKey: process.env.AZURE_SECRET_KEY,
    azureOpenAIApiDeploymentName: process.env.OPENAI_TTT_MODEL,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview",
    reasoningEffort: "low",
    maxRetries: 2,
  });
}

const SYSTEM = `You are a rigorous, fair technical recruiter and ATS expert. You evaluate a resume against a target role and (optionally) a specific job description.

Hard rules:
- Cite EVIDENCE verbatim from the resume. Never invent experience, skills, or numbers the candidate did not write.
- For keyword matching, only list a skill under "matched" if it genuinely appears in the resume text or skills.
- Findings must be specific and actionable. For rewrite findings, "before" must be a real line from the resume and "after" must preserve the candidate's actual facts while improving phrasing/impact — do not fabricate metrics.
- Rank findings most-severe first. Prefer 4-8 high-signal findings over many trivial ones.
- Score honestly on a 0-100 scale; do not inflate.`;

const HUMAN = `# Target
Role: {role}
Experience level: {experience}
{jdBlock}

# Candidate resume (structured)
{summary}

# Candidate resume (raw text excerpt)
{rawText}

Evaluate the resume against the target and return the structured assessment.`;

function trim(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function compactSummary(summary: ParsedSummary | null): string {
  if (!summary) return "(no structured summary available)";
  const skills = (summary.technicalSkills ?? [])
    .map((s) => s.name)
    .filter(Boolean)
    .join(", ");
  const exp = (summary.experience ?? [])
    .map((e) => `- ${e.role ?? "?"} @ ${e.company ?? "?"} (${e.duration ?? "?"})\n${(e.work ?? []).map((w) => `    • ${w}`).join("\n")}`)
    .join("\n");
  const proj = (summary.projects ?? [])
    .map((p) => `- ${p.name ?? "?"} [${(p.skills ?? []).join(", ")}]\n${(p.about ?? []).map((a) => `    • ${a}`).join("\n")}`)
    .join("\n");
  return [
    `Name: ${summary.name ?? "?"}`,
    `Title: ${summary.role ?? "?"} | Experience: ${summary.yearOfExp ?? "?"}`,
    `Skills: ${skills || "(none parsed)"}`,
    `Experience:\n${exp || "(none parsed)"}`,
    `Projects:\n${proj || "(none parsed)"}`,
  ].join("\n\n");
}

async function firstChunk(jd: string): Promise<string> {
  if (jd.length <= 4000) return jd;
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
  const chunks = await splitter.splitText(jd);
  return chunks[0] ?? jd.slice(0, 4000);
}

function toCoverage(matched: string[], missing: string[]): KeywordMatch {
  const total = matched.length + missing.length;
  const coverage = total === 0 ? 0 : Math.round((matched.length / total) * 100);
  return { matched, missing, coverage };
}

export async function judgeResume(
  summary: ParsedSummary | null,
  rawText: string,
  target: AnalysisTarget,
): Promise<JudgeResult> {
  try {
    const jd = target.jdText ? await firstChunk(target.jdText) : "";
    const jdBlock = jd
      ? `Job description:\n${jd}`
      : "No specific job description supplied — evaluate against typical expectations for the target role and level, and infer the keywords such a role demands.";

    const model = getModel().withStructuredOutput(judgeSchema, { name: "resume_evaluation" });
    const prompt = await ChatPromptTemplate.fromMessages([
      ["system", SYSTEM],
      ["human", HUMAN],
    ]).invoke({
      role: target.role ?? "(unspecified)",
      experience: target.experience ?? "(unspecified)",
      jdBlock,
      summary: compactSummary(summary),
      rawText: trim(rawText ?? "", 6000),
    });

    const out = await model.invoke(prompt);

    const findings: Finding[] = out.findings.map((f) => ({
      severity: f.severity,
      category: f.category,
      title: f.title,
      evidence: f.evidence,
      suggestion: f.suggestion,
      before: f.before ?? undefined,
      after: f.after ?? undefined,
    }));

    return {
      available: true,
      content: out.content,
      keywords: toCoverage(out.keywords.matched, out.keywords.missing),
      findings,
    };
  } catch (err) {
    console.error("[ats/judge] LLM judge failed, degrading to deterministic-only:", err);
    return { available: false, content: null, keywords: null, findings: [] };
  }
}
