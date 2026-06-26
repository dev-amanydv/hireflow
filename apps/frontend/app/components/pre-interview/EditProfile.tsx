import { useState } from "react";
import { Check, FileText, Link2, Plus, X } from "lucide-react";
import { FaLinkedinIn, FaGithub } from "react-icons/fa";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import type { CandidateProfile } from "./types";

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <span className=" text-[10.5px] uppercase tracking-[0.1em] text-foreground">{children}</span>
      <span className="h-px flex-1 bg-border" />
      {hint}
    </div>
  );
}

function LinkRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex h-[42px] items-center gap-2.5 rounded-lg border px-3">
      {icon}
      <input
        defaultValue={value}
        className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none"
      />
    </div>
  );
}

export default function EditProfile({
  open,
  onOpenChange,
  candidate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateProfile;
  onSave: (candidate: CandidateProfile) => void;
}) {
  const [skills, setSkills] = useState<string[]>(candidate.skills);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[88vh] w-[640px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0"
      >
        <div className="border-b px-6 py-5">
          <div className=" text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            Candidate profile
          </div>
          <DialogTitle className="mt-1.5 text-[19px] font-semibold tracking-tight">
            Edit extracted info
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px]">
            Auto-filled from your resume and public GitHub. Review and refine before starting.
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SectionLabel
            hint={
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground">
                <FileText className="size-2.5" />
                from resume
              </span>
            }
          >
            Basics
          </SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Full name</span>
              <Input defaultValue={candidate.fullName} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Location</span>
              <Input defaultValue={candidate.location} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Title</span>
              <Input defaultValue={candidate.title} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Years of experience</span>
              <Input defaultValue={candidate.years} />
            </label>
          </div>

          <div className="mt-6">
            <SectionLabel>Professional summary</SectionLabel>
            <Textarea defaultValue={candidate.summary} className="min-h-21 resize-y" />
          </div>

          <div className="mt-6">
            <SectionLabel>Links</SectionLabel>
            <div className="flex flex-col gap-2.5">
              <div className="flex h-[42px] items-center gap-2.5 rounded-lg border px-3">
                <FaGithub className="size-4 text-muted-foreground" />
                <input
                  defaultValue={candidate.github}
                  className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none"
                />
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <Check className="size-2.5" strokeWidth={3.2} />
                  scraped
                </span>
              </div>
              <LinkRow icon={<FaLinkedinIn className="size-4 text-muted-foreground" />} value={candidate.linkedin} />
              <LinkRow icon={<Link2 className="size-4 text-muted-foreground" />} value={candidate.portfolio} />
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Skills</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 py-1.5 pl-3 pr-2 text-[13px]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills((s) => s.filter((x) => x !== skill))}
                    className="text-muted-foreground/60 transition-opacity hover:text-foreground"
                  >
                    <X className="size-3" strokeWidth={2.2} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[13px] text-muted-foreground hover:border-foreground/40"
              >
                <Plus className="size-3" strokeWidth={2.2} />
                Add skill
              </button>
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel
              hint={<span className="text-[11px] text-muted-foreground">included in interview context</span>}
            >
              GitHub projects
            </SectionLabel>
            <div className="flex flex-col gap-2.5">
              {candidate.projects.map((project) => (
                <div
                  key={project.name}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5",
                    !project.included && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md",
                      project.included ? "bg-emerald-500" : "border-[1.5px] border-muted-foreground/40"
                    )}
                  >
                    {project.included && <Check className="size-3 text-white" strokeWidth={3.2} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{project.name}</span>
                      <span className=" text-[11px] text-muted-foreground">
                        ★ {project.stars} · {project.language}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                      {project.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-6 py-4">
          <span className="text-xs text-muted-foreground">Edits apply to this interview only.</span>
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave({ ...candidate, skills });
                onOpenChange(false);
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
