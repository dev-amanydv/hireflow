import { useEffect, useRef, useState } from "react";

export type StageState = "done" | "active" | "pending";

export interface Stage {
  id: string;
  label: string;
  state: StageState;
}

const RULES_ESTIMATE_MS = 4000;

const LABELS = {
  read: "Reading your resume",
  rules: "Running ATS rule checks",
  judge: "AI content review",
  score: "Scoring & report",
} as const;

function statesFor(status: string, elapsed: number): Record<keyof typeof LABELS, StageState> {
  if (status === "COMPLETE") {
    return { read: "done", rules: "done", judge: "done", score: "done" };
  }
  if (status === "UPLOADING" || status === "PARSING") {
    return { read: "active", rules: "pending", judge: "pending", score: "pending" };
  }
  if (status === "PARSED") {
    return { read: "done", rules: "active", judge: "pending", score: "pending" };
  }
  if (elapsed < RULES_ESTIMATE_MS) {
    return { read: "done", rules: "active", judge: "pending", score: "pending" };
  }
  return { read: "done", rules: "done", judge: "active", score: "pending" };
}

export function useAnalysisStages(status: string): Stage[] {
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const analyzing = status === "ANALYZING";

  useEffect(() => {
    if (!analyzing) {
      startedAt.current = null;
      setElapsed(0);
      return;
    }
    startedAt.current = Date.now();
    setElapsed(0);
    const timer = setInterval(() => {
      setElapsed(Date.now() - (startedAt.current ?? Date.now()));
    }, 500);
    return () => clearInterval(timer);
  }, [analyzing]);

  const states = statesFor(status, elapsed);
  return (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((id) => ({
    id,
    label: LABELS[id],
    state: states[id],
  }));
}

export function activeStageLabel(stages: Stage[]): string | null {
  return stages.find((s) => s.state === "active")?.label ?? null;
}
