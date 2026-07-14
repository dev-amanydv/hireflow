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

// The scorecard shape persisted to Result.report and rendered on the result page.
export const feedbackSchema = z.object({
  overall: z.number(),
  summary: z.string(),
  topics: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      comment: z.string(),
    }),
  ),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  studyNext: z.array(z.string()),
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
 * Evaluate a completed interview transcript and produce a scorecard. Scores each
 * topic 0-100 against the target seniority, plus an overall score and qualitative
 * strengths / gaps / study-next. For practice interviews the topics come from the
 * curated catalog; otherwise the judge derives topic areas from the conversation.
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

  const conversation = transcript
    .map(
      (t) =>
        `${t.role === "Assistant" ? "Interviewer" : "Candidate"}: ${t.content}`,
    )
    .join("\n");

  const system = `You are an expert technical interviewer grading a completed voice interview.
Evaluate the CANDIDATE's answers only (ignore the interviewer's questions except as context).
Calibrate all scores to the target seniority: ${EXPERIENCE_LABELS[experience]}.

Scoring rules:
- Every score (overall and per-topic) is an integer from 0 to 100.
- Base scores strictly on evidence in the transcript. If a topic was never discussed, give it a low-to-neutral score and say so in its comment.
- If the transcript is very short or the candidate barely engaged, reflect that with low scores and note it in the summary.
- "overall" is a holistic weighted judgement, not a raw average.
- Keep comments, strengths, gaps, and studyNext specific and actionable (each a short phrase or sentence). Reference concrete moments from the answers where possible.

${topicGuidance}`;

  const user = `Role: ${jobRole}
Target level: ${EXPERIENCE_LABELS[experience]}

Interview transcript:
${conversation || "(no transcript was recorded)"}`;

  try {
    const response = await openai.responses.create({
      model: model,
      reasoning: { effort: "low" },
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
