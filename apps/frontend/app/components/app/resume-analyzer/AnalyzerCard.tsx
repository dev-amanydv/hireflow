import { useId, useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { InputFile } from "~/components/pre-interview/ui/file-upload";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";
import { EXPERIENCE_OPTIONS, ROLE_OPTIONS } from "./types";

export type TargetMode = "general" | "specific";

export type UploadPhase = "idle" | "parsing" | "ready";

function TargetOption({
  value,
  title,
  description,
  selected,
  children,
}: {
  value: TargetMode;
  title: string;
  description: string;
  selected: boolean;
  children?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        selected
          ? "border-primary/50 bg-primary/[0.04] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
          : "border-border hover:border-foreground/20 hover:bg-muted/30",
      )}
    >
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 p-3.5">
        <RadioGroupItem value={value} id={id} className="mt-0.5" />
        <span className="min-w-0">
          <span
            className={cn(
              "block text-sm font-medium transition-colors",
              selected ? "text-foreground" : "text-ink-subtle",
            )}
          >
            {title}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-tertiary">
            {description}
          </span>
        </span>
      </label>
      {selected && children ? (
        <div className="ln-rise flex flex-col gap-3.5 px-3.5 pb-3.5 pl-10">{children}</div>
      ) : null}
    </div>
  );
}

export default function AnalyzerCard({
  phase,
  mode,
  onModeChange,
  role,
  onRoleChange,
  experience,
  onExperienceChange,
  jdText,
  onJdTextChange,
  onUploaded,
  onRemoved,
  onUploadError,
  onSubmit,
  submitting,
  pendingParse,
}: {
  phase: UploadPhase;
  mode: TargetMode;
  onModeChange: (mode: TargetMode) => void;
  role: string;
  onRoleChange: (role: string) => void;
  experience: string;
  onExperienceChange: (experience: string) => void;
  jdText: string;
  onJdTextChange: (jd: string) => void;
  onUploaded: (id: string) => void;
  onRemoved: () => void;
  onUploadError: (info: { status?: number; message?: string }) => void;
  onSubmit: () => void;
  submitting: boolean;
  pendingParse: boolean;
}) {
  const [jdOpen, setJdOpen] = useState(false);

  const hasFile = phase !== "idle";
  const needsRole = mode === "specific" && !role;
  const disabled = !hasFile || needsRole || submitting || pendingParse;

  const label = !hasFile
    ? "Upload a resume to start"
    : needsRole
      ? "Choose a target role"
      : pendingParse
        ? "Waiting for your resume…"
        : submitting
          ? "Starting analysis…"
          : "Analyze my resume";

  return (
    <section className="ln-lift ln-rise overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Your resume</h2>
            <span className="text-[11px] text-ink-tertiary">PDF · max 5MB</span>
          </div>

          <InputFile
            uploadUrl={`${BACKEND_URL}/resume/upload`}
            requireInterviewId={false}
            accept=".pdf"
            hint="PDF only (max. 5MB)"
            className="flex-1"
            dropzoneClassName="flex-1 justify-center py-10"
            sampleResume={{
              url: "/aman_yadav_resume.pdf",
              fileName: "Aman Yadav - Resume.pdf",
              label: "No resume on hand?",
            }}
            onUploaded={(data) => {
              const id = (data as { id?: string } | undefined)?.id;
              if (id) onUploaded(id);
            }}
            onRemoved={onRemoved}
            onUploadError={onUploadError}
            forbiddenMessage="Free limit reached"
          />
        </div>

        <div className="flex flex-col gap-4 p-5 lg:p-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">What should we score it against?</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-subtle">
              You can set this while your resume uploads.
            </p>
          </div>

          <RadioGroup
            value={mode}
            onValueChange={(v) => v && onModeChange(v as TargetMode)}
            className="gap-2.5"
          >
            <TargetOption
              value="general"
              title="General review"
              description="Formatting, structure, clarity and impact — what holds true for any role."
              selected={mode === "general"}
            />
            <TargetOption
              value="specific"
              title="Specific role"
              description="Everything above, plus a keyword match against the job you want."
              selected={mode === "specific"}
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-subtle">Target role *</span>
                <Select value={role} onValueChange={onRoleChange}>
                  <SelectTrigger className="h-9 w-full bg-card">
                    <SelectValue placeholder="Select a role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-subtle">Experience level</span>
                <Select value={experience} onValueChange={onExperienceChange}>
                  <SelectTrigger className="h-9 w-full bg-card">
                    <SelectValue placeholder="Any / unspecified" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setJdOpen((v) => !v)}
                  aria-expanded={jdOpen}
                  className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-subtle transition-colors hover:text-foreground"
                >
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", jdOpen && "rotate-180")}
                  />
                  Add a job description
                  <span className="text-ink-tertiary">— sharpest keyword match</span>
                </button>
                {jdOpen && (
                  <Textarea
                    value={jdText}
                    onChange={(e) => onJdTextChange(e.target.value)}
                    placeholder="Paste the job posting here…"
                    className="ln-rise min-h-28 bg-card"
                  />
                )}
              </div>
            </TargetOption>
          </RadioGroup>

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <Button onClick={onSubmit} disabled={disabled} size="lg" className="w-full gap-2">
              {submitting || pendingParse ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {label}
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-ink-tertiary">
              Takes a minute or two. It keeps running if you leave this page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
