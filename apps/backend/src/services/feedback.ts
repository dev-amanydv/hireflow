import OpenAI from "openai";
import z from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { getSkill, type Difficulty } from "../data/skillCatalog";

const baseUrl = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_SECRET_KEY;
const model = process.env.OPENAI_TTT_MODEL;

const openai = new OpenAI({
  baseURL: `${baseUrl}/openai/v1/`,
  apiKey: apiKey,
});

/**
 * The fixed competency dimensions every interview is scored against. Keeping this
 * set stable (rather than per-skill) is what makes scores comparable across
 * interviews and lets us reason about a candidate's trend over time.
 */
export const DIMENSIONS = [
  {
    key: "technical_depth",
    name: "Technical Depth",
    description:
      "Command of the underlying concepts — correctness, depth of understanding, and awareness of edge cases and nuance.",
  },
  {
    key: "problem_solving",
    name: "Problem-Solving",
    description:
      "How they reason through problems — decomposition, handling ambiguity, weighing trade-offs, and arriving at sound decisions.",
  },
  {
    key: "communication",
    name: "Communication & Clarity",
    description:
      "How clearly and concisely they explain their thinking — structure, precision of language, and ease of following their reasoning.",
  },
  {
    key: "practical_application",
    name: "Practical Application",
    description:
      "Ability to apply knowledge to real situations — concrete examples from experience, pragmatism, and sound engineering judgement.",
  },
] as const;

const DIMENSION_KEYS = DIMENSIONS.map((d) => d.key) as [string, ...string[]];

// A single, cleaned quote from the candidate plus why it matters. `quote` is a
// readable paraphrase of what the candidate conveyed — never raw garbled ASR text.
const EvidenceSchema = z.object({
  quote: z.string(),
  note: z.string(),
});

const DimensionSchema = z.object({
  key: z.enum(DIMENSION_KEYS),
  name: z.string(),
  score: z.number(),
  rationale: z.string(),
});

const TopicSchema = z.object({
  name: z.string(),
  score: z.number(),
  summary: z.string(),
  wentWell: z.array(z.string()),
  toImprove: z.array(z.string()),
  evidence: z.array(EvidenceSchema),
});

const HighlightSchema = z.object({
  title: z.string(),
  detail: z.string(),
  evidence: EvidenceSchema.nullable(),
});

const StudyItemSchema = z.object({
  focus: z.string(),
  why: z.string(),
  action: z.string(),
});

// The scorecard shape (v2) persisted inside Result.report and rendered on the
// result page. `schemaVersion` is stamped by the worker at store time, not asked
// of the model, so it lives outside this schema.
export const feedbackSchema = z.object({
  overall: z.number(),
  band: z.enum(["exceptional", "strong", "developing", "early"]),
  bandLabel: z.string(),
  headline: z.string(),
  summary: z.string(),
  dimensions: z.array(DimensionSchema),
  topics: z.array(TopicSchema),
  strengths: z.array(HighlightSchema),
  growthAreas: z.array(HighlightSchema),
  studyPlan: z.array(StudyItemSchema),
  transcriptNote: z.string().nullable(),
});

export type InterviewFeedback = z.infer<typeof feedbackSchema>;

export interface TranscriptTurn {
  role: "User" | "Assistant";
  content: string;
}

interface FeedbackInput {
  transcript: TranscriptTurn[];
  skillId?: string | null;
  jobRole: string;
  experience: Difficulty;
}

const EXPERIENCE_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner (no professional experience)",
  junior: "Junior (roughly 0 to 2 years)",
  mid: "Mid-level (roughly 2 to 5 years)",
  senior: "Senior (roughly 5 to 9 years)",
  staff: "Staff or above (10+ years)",
};

/**
 * Evaluate a completed interview transcript and produce a rich, evidence-bound
 * scorecard. Every candidate is scored on the fixed competency DIMENSIONS plus a
 * per-topic breakdown (curated catalog topics for practice interviews, otherwise
 * topics derived from the conversation). Scores are 0-100, calibrated to the
 * target seniority. The transcript comes from voice ASR and may be garbled — the
 * judge is told to read for intent and paraphrase, never to quote raw noise.
 */
export async function getInterviewFeedback(
  input: FeedbackInput,
): Promise<InterviewFeedback | null> {
  const { transcript, skillId, jobRole, experience } = input;
  const skill = skillId ? getSkill(skillId) : undefined;

  const topicGuidance = skill
    ? `Score the candidate on each of these ${skill.label} topic areas (use these exact names):\n` +
      skill.topics
        .map((t) => `- ${t.name}: ${t.subtopics.join(", ")}`)
        .join("\n") +
      `\n\nWhat strong performance looks like at this level: ${skill.levelRubric[experience]}`
    : `Derive 4 to 6 relevant topic areas from the conversation for the role "${jobRole}" and score each.`;

  const dimensionGuidance = DIMENSIONS.map(
    (d) => `- "${d.key}" (${d.name}): ${d.description}`,
  ).join("\n");

  const conversation = transcript
    .map(
      (t) =>
        `${t.role === "Assistant" ? "Interviewer" : "Candidate"}: ${t.content}`,
    )
    .join("\n");

  const system = `You are an expert technical interviewer writing a detailed, fair scorecard for a completed voice interview.
Evaluate the CANDIDATE's answers only (treat the interviewer's questions purely as context).
Calibrate every judgement to the target seniority: ${EXPERIENCE_LABELS[experience]}.

This transcript was produced by automatic speech recognition and may contain mis-transcribed, phonetically confused, or nonsensical words. Read for the candidate's overall meaning and intent, not the literal wording. Never penalise the candidate for obvious transcription artifacts. When you cite evidence, paraphrase what the candidate conveyed into clean, readable language — do NOT reproduce garbled or nonsensical text verbatim. If the transcript is too noisy or sparse to judge a point confidently, say so rather than inventing detail. Use "transcriptNote" to flag when transcription quality or a very short transcript limited your assessment (otherwise set it to null).

Scoring rules:
- Every score (overall, per-dimension, per-topic) is an integer from 0 to 100.
- Base every score strictly on evidence in the transcript. If something was never discussed, give it a low-to-neutral score and say so explicitly.
- If the candidate barely engaged, reflect that with low scores and note it in the summary.
- "overall" is a holistic, weighted judgement — not a raw average of the parts.
- "band" reflects performance RELATIVE TO THE TARGET LEVEL: "exceptional" (clearly above the bar), "strong" (solidly meets it), "developing" (partially meets it, gaps remain), "early" (well below the bar). "bandLabel" is a short human phrase pairing the band with the level, e.g. "Strong for Senior" or "Developing for Mid-level".
- "headline" is one crisp sentence capturing the overall verdict.
- "summary" is 2-3 sentences of honest, specific narrative.

Score the candidate on ALL FOUR of these fixed competency dimensions (return exactly these four, using these exact keys and names):
${dimensionGuidance}

For every topic, give a 1-sentence "summary", concrete "wentWell" and "toImprove" points, and "evidence": short paraphrased moments from the candidate's answers (each with a "note" on why it matters). Make "strengths" and "growthAreas" specific and evidence-backed (attach an evidence moment where one exists, otherwise null). "studyPlan" items must be genuinely actionable — a focus area, why it matters for them, and a concrete next action.

${topicGuidance}`;

  const user = `Role: ${jobRole}
Target level: ${EXPERIENCE_LABELS[experience]}

Interview transcript:
${conversation || "(no transcript was recorded)"}`;

  try {
    const response = await openai.responses.create({
      model: model,
      reasoning: { effort: "medium" },
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      text: {
        format: zodTextFormat(feedbackSchema, "interviewFeedback"),
      },
    });
    return response.output_text ? JSON.parse(response.output_text) : null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
