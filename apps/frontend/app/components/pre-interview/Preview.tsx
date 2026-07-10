import { useEffect, useState } from "react";
import { ArrowLeft, Code2, FileText, Network, Pencil, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import EditProfile from "./EditProfile";
import PreviewSkeleton from "./PreviewSkeleton";
import {
  EXPERIENCE_LABELS,
  FOCUS_LABELS,
  MOCK_CANDIDATE,
  summaryToCandidate,
  type CandidateProfile,
  type ResumeSummary,
  type RoleDetails,
  type SessionDetails,
} from "./types";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SummaryRow({ label, value, border = true }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={"flex items-center justify-between px-4 py-3.5" + (border ? " border-b" : "")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function Preview({
  roleDetails,
  sessionDetails,
  summary,
  setStep,
  onStart,
  loading,
  error
}: {
  roleDetails: RoleDetails;
  sessionDetails: SessionDetails;
  summary: ResumeSummary | null;
  setStep: (value: number) => void;
  onStart: () => void;
  loading: boolean;
  error: boolean;
}) {

  const [candidate, setCandidate] = useState<CandidateProfile>(() =>
    summary ? summaryToCandidate(summary) : MOCK_CANDIDATE
  );
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (summary) setCandidate(summaryToCandidate(summary));
  }, [summary]);

  const includedProjects = candidate.projects.filter((p) => p.included).length;
  const rolesCount = summary?.experience.length ?? 0;

  return loading || error ? (
    <PreviewSkeleton error={error} onBack={() => setStep(2)} />
  ) : <div>
      <div className="mb-6">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Step 03 — Review
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
          Ready to begin?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm your session and profile, then start when you're ready.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <SummaryRow
          label="Role"
          value={`${roleDetails.jobRole} · ${EXPERIENCE_LABELS[roleDetails.experience]}`}
        />
        <div className="flex">
          <div className="flex flex-1 items-center justify-between border-r px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Focus</span>
            <span className="text-sm font-semibold">{FOCUS_LABELS[roleDetails.type]}</span>
          </div>
          <div className="flex flex-1 items-center justify-between border-r px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Questions</span>
            <span className="text-sm font-semibold">{sessionDetails.questions}</span>
          </div>
          <div className="flex flex-1 items-center justify-between px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Duration</span>
            <span className="text-sm font-semibold">{sessionDetails.duration} min</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Candidate profile</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.04em] text-muted-foreground">
            Auto-built from resume + GitHub
          </span>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background">
              {initialsOf(candidate.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15.5px] font-semibold">{candidate.fullName}</span>
                {candidate.location && (
                  <span className="text-[13px] text-muted-foreground">· {candidate.location}</span>
                )}
              </div>
              {candidate.headline && (
                <div className="mt-0.5 text-[13px] text-foreground/70">{candidate.headline}</div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-2">
                {candidate.github && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/80">
                    <FaGithub className="size-3.5 text-muted-foreground" />
                    {candidate.github}
                  </span>
                )}
                {candidate.linkedin && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/80">
                    <FaLinkedinIn className="size-3.5 text-muted-foreground" />
                    {candidate.linkedin}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2 border-t pt-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs text-foreground/80">
              <FileText className="size-3 text-muted-foreground" />
              {candidate.skills.length} skills
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs text-foreground/80">
              <Code2 className="size-3 text-muted-foreground" />
              {includedProjects} GitHub projects
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs text-foreground/80">
              <Network className="size-3 text-muted-foreground" />
              {rolesCount} {rolesCount === 1 ? "role" : "roles"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2.5">
        <Button type="button" size="lg" className="h-13 w-full gap-2.5 text-[15.5px]" onClick={onStart}>
          <Sparkles className="size-[18px]" />
          Start interview
        </Button>
        <span className="text-[11px] text-muted-foreground">
          approx. {sessionDetails.duration} min · {sessionDetails.questions} questions
        </span>
      </div>

      <div className="mt-6 flex justify-start border-t pt-6">
        <Button type="button" variant="outline" size="lg" className="gap-2 px-5" onClick={() => setStep(2)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      <EditProfile
        open={editOpen}
        onOpenChange={setEditOpen}
        candidate={candidate}
        onSave={setCandidate}
      />
    </div>
}
