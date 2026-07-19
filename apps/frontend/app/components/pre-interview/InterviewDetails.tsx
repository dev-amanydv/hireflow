import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { MOCK_SESSION, type SessionDetails } from "./types";
import { InputFile } from "./ui/file-upload";

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
  interviewId,
  session,
  onResumeComplete,
  onContinue,
}: {
  interviewId: string;
  session: SessionDetails | null;
  onResumeComplete: (value: SessionDetails) => void;
  onContinue: () => void;
}) {
  const hasResume = Boolean(session?.resume.name);
  const [replacing, setReplacing] = useState(false);
  const showUploader = !hasResume || replacing;

  return (
    <div>
      <div className="mb-8">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Step 02 — Session
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
          Set up the session
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload the resume we'll use to tailor the interview. You can swap it
          out anytime before you start.
        </p>
      </div>

      <div className="space-y-7">
        <Field label="Resume">
          <div className="space-y-3">
            {hasResume && !replacing && (
              <div className="overflow-hidden rounded-2xl border bg-card">
                <div className="flex items-center gap-3.5 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="size-5 text-foreground/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {session!.resume.name}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="size-3.5" />
                        Uploaded
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {session!.resume.size}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplacing(true)}
                    className="shrink-0 text-[13px] font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Upload a new resume
                  </button>
                </div>
              </div>
            )}

            {showUploader && (
              <>
                <InputFile
                  interviewId={interviewId}
                  sampleResume={{
                    url: "/sample-resume.pdf",
                    fileName: "Sample Resume.pdf",
                    label: "Not have one? Use our sample resume.",
                  }}
                  onComplete={(file) => {
                    onResumeComplete({
                      resume: {
                        name: file.name,
                        size: `${file.size} · ${file.ext.toUpperCase()}`,
                        parsed: true,
                        skills: MOCK_SESSION.resume.skills,
                      },
                    });
                    setReplacing(false);
                  }}
                />
                {hasResume && (
                  <button
                    type="button"
                    onClick={() => setReplacing(false)}
                    className="text-[13px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Keep current resume
                  </button>
                )}
              </>
            )}
          </div>
        </Field>
      </div>

      <div className="mt-8 flex justify-end border-t pt-6">
        <Button
          type="button"
          size="lg"
          className="gap-2 px-6"
          onClick={onContinue}
          disabled={!hasResume}
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
