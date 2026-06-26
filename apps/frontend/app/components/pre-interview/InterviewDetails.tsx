import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, FileText, SlidersHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { MOCK_SESSION, type SessionDetails } from "./types";
import { InputFile } from "./ui/file-upload";

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
  interviewId
}: {
  setSessionDetails: (value: SessionDetails) => void;
  setStep: (value: number) => void;
  interviewId: string
}) {
  const [data, setData] = useState<SessionDetails>({
    resume: {
      name: "",
      size: "",
      parsed: false,
      skills: []
    },
    questions: 5,
    duration: 15
  });
  

  console.log(interviewId)
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
          {data.resume.name ? <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-3.5 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-foreground/70" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{data.resume.name}</span>
                  
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{data.resume.size}</div>
              </div>
              <button type="button" className="text-[13px] font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Replace
              </button>
            </div>
          </div> : (
            <InputFile
              interviewId={interviewId}
              onComplete={(file) =>
                setData((d) => ({
                  ...d,
                  resume: {
                    name: file.name,
                    size: `${file.size} · ${file.ext.toUpperCase()}`,
                    parsed: true,
                    skills: MOCK_SESSION.resume.skills,
                  },
                }))
              }
            />
          )}
        </Field>

        <Field label="Number of questions" icon={<SlidersHorizontal className="size-3.5 text-muted-foreground" />}>
          <div className="grid grid-cols-3 gap-2.5">
            {QUESTION_OPTIONS.map((q) => {
              const on = data.questions === q.value;
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, questions: q.value }))}
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
            {DURATION_OPTIONS.map((dur) => {
              const on = data.duration === dur;
              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, duration: dur }))}
                  className={cn(
                    "flex items-baseline justify-center gap-1 rounded-xl border px-4 py-3.5 transition-all",
                    on
                      ? "border-foreground bg-card "
                      : "border-border/30 bg-muted/40 hover:border-foreground/30"
                  )}
                >
                  <span className="text-lg font-bold">{dur}</span>
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
