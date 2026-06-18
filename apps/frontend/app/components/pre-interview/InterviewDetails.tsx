import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, FileText, SlidersHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { MOCK_SESSION, type SessionDetails } from "./types";

const QUESTION_OPTIONS = [
  { value: 5, label: "Quick" },
  { value: 8, label: "Balanced" },
  { value: 12, label: "Thorough" },
] as const;

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <label className="block text-xs font-semibold tracking-tight text-muted-foreground">
          {label}
        </label>
      </div>
      {children}
    </div>
  );
}

export default function InterviewDetails({
  setSessionDetails,
  setStep,
}: {
  setSessionDetails: (value: SessionDetails) => void;
  setStep: (value: number) => void;
}) {
  const [data, setData] = useState<SessionDetails>(MOCK_SESSION);

  const set = (patch: Partial<SessionDetails>) => setData((d) => ({ ...d, ...patch }));

  const onContinue = () => {
    setSessionDetails(data);
    setStep(3);
  };

  return (
    <div>
      <div className="mb-8">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Step 02 — Session
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
          Set up the session
        </h1>
      </div>

      <div className="space-y-7">
        <Field label="Resume">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-3.5 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-foreground/70" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{data.resume.name}</span>
                  {data.resume.parsed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <Check className="size-2.5" strokeWidth={3.2} />
                      Parsed
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{data.resume.size}</div>
              </div>
              <button type="button" className="text-[13px] font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Replace
              </button>
            </div>
            <div className="border-t bg-muted/40 p-4">
              <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                Detected skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.resume.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Field>

        <Field label="Number of questions" icon={<SlidersHorizontal className="size-3.5 text-muted-foreground" />}>
          <div className="grid grid-cols-3 gap-2.5">
            {QUESTION_OPTIONS.map((q) => {
              const on = data.questions === q.value;
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => set({ questions: q.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-4 py-3.5 transition-all",
                    on
                      ? "border-foreground bg-card "
                      : "border-border/30 bg-muted/40 hover:border-foreground/30"
                  )}
                >
                  <span className="text-[22px] font-bold tracking-tight">{q.value}</span>
                  <span className="text-xs text-muted-foreground">{q.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Max duration" icon={<Clock className="size-3.5 text-muted-foreground" />}>
          <div className="grid grid-cols-4 gap-2.5">
            {DURATION_OPTIONS.map((d) => {
              const on = data.duration === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => set({ duration: d })}
                  className={cn(
                    "flex items-baseline justify-center gap-1 rounded-xl border px-4 py-3.5 transition-all",
                    on
                      ? "border-foreground bg-card "
                      : "border-border/30 bg-muted/40 hover:border-foreground/30"
                  )}
                >
                  <span className="text-lg font-bold">{d}</span>
                  <span className="text-xs text-muted-foreground">min</span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="mt-8 flex justify-between border-t pt-6">
        <Button type="button" variant="outline" size="lg" className="gap-2 px-5" onClick={() => setStep(1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button type="button" size="lg" className="gap-2 px-6" onClick={onContinue}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
