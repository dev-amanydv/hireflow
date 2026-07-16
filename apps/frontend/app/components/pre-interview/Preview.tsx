import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Check,
  FolderGit2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { BACKEND_URL } from "~/lib/config";
import PreviewSkeleton from "./PreviewSkeleton";
import {
  EXPERIENCE_LABELS,
  type ResumeSummary,
  type RoleDetails,
} from "./types";

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function stripUrl(url: string | null | undefined) {
  return url ? url.replace(/^https?:\/\//, "").replace(/\/+$/, "") : "";
}

function Section({
  icon,
  title,
  count,
  action,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        {typeof count === "number" && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
        <span className="h-px flex-1" />
        {action}
      </div>
      {children}
    </section>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function Preview({
  roleDetails,
  summary,
  interviewId,
  setStep,
  onStart,
  onSummaryChange,
  loading,
  error,
}: {
  roleDetails: RoleDetails;
  summary: ResumeSummary | null;
  interviewId: string;
  setStep: (value: number) => void;
  onStart: () => void;
  onSummaryChange: (summary: ResumeSummary) => void;
  loading: boolean;
  error: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ResumeSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  if (loading || error || !summary) {
    return <PreviewSkeleton error={error} onBack={() => setStep(2)} />;
  }

  const view = editing && draft ? draft : summary;

  const patch = (partial: Partial<ResumeSummary>) =>
    setDraft((d) => (d ? { ...d, ...partial } : d));

  const startEditing = () => {
    setDraft(structuredClone(summary));
    setSkillInput("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
  };

  const addSkill = () => {
    const name = skillInput.trim();
    if (!name || !draft) return;
    const exists = draft.technicalSkills.some(
      (s) => s.name?.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      patch({ technicalSkills: [...draft.technicalSkills, { name, usedIn: null }] });
    }
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    if (!draft) return;
    patch({ technicalSkills: draft.technicalSkills.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await axios.patch(
        `${BACKEND_URL}/interview/pre/${interviewId}/summary`,
        draft,
        { withCredentials: true }
      );
      onSummaryChange(draft);
      setEditing(false);
      setDraft(null);
      toast.success("Profile updated");
    } catch {
      toast.error("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const skills = view.technicalSkills
    .map((s) => s.name)
    .filter((n): n is string => Boolean(n));
  const headline = [view.role, view.yearOfExp].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Step 03 — Review
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
            Ready to begin?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {editing
              ? "Refine the details and summary — this is what the interviewer will see."
              : "Review your profile and edit anything before you start."}
          </p>
        </div>
        {!editing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={startEditing}
          >
            <Pencil className="size-3.5" />
            Edit profile
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border px-4 py-3.5">
        <span className="text-xs text-muted-foreground">Role</span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {roleDetails.jobRole} · {EXPERIENCE_LABELS[roleDetails.experience]}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Lock className="size-2.5" />
            Locked
          </span>
        </span>
      </div>

      <Section title="Candidate profile">
        <div className="rounded-2xl border p-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background">
              {initialsOf(view.name)}
            </div>
            <div className="min-w-0 flex-1">
              {editing && draft ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditField
                    label="Full name"
                    value={draft.name}
                    onChange={(v) => patch({ name: v })}
                  />
                  <EditField
                    label="Title / role"
                    value={draft.role ?? ""}
                    placeholder="e.g. Backend Engineer"
                    onChange={(v) => patch({ role: v || null })}
                  />
                </div>
              ) : (
                <>
                  <div className="text-[15.5px] font-semibold">{view.name}</div>
                  {headline && (
                    <div className="mt-0.5 text-[13px] text-foreground/70">{headline}</div>
                  )}
                </>
              )}
            </div>
          </div>

          {editing && draft ? (
            <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
              <EditField
                label="Email"
                value={draft.email ?? ""}
                onChange={(v) => patch({ email: v || null })}
              />
              <EditField
                label="Phone"
                value={draft.phone ?? ""}
                onChange={(v) => patch({ phone: v || null })}
              />
              <EditField
                label="GitHub"
                value={draft.github ?? ""}
                onChange={(v) => patch({ github: v || null })}
              />
              <EditField
                label="LinkedIn"
                value={draft.linkedIn ?? ""}
                onChange={(v) => patch({ linkedIn: v || null })}
              />
            </div>
          ) : (
            (view.email || view.phone || view.github || view.linkedIn) && (
              <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t pt-3.5">
                {view.email && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/80">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {view.email}
                  </span>
                )}
                {view.phone && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/80">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {view.phone}
                  </span>
                )}
                {view.github && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/80">
                    <FaGithub className="size-3.5 text-muted-foreground" />
                    {stripUrl(view.github)}
                  </span>
                )}
                {view.linkedIn && (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/80">
                    <FaLinkedinIn className="size-3.5 text-muted-foreground" />
                    {stripUrl(view.linkedIn)}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </Section>

      <Section title="Professional summary">
        <div className="rounded-2xl border p-4">
          {editing && draft ? (
            <Textarea
              value={draft.summary ?? ""}
              placeholder="A short professional summary…"
              className="min-h-28 resize-y"
              onChange={(e) => patch({ summary: e.target.value || null })}
            />
          ) : view.summary ? (
            <p className="text-[13.5px] leading-relaxed text-foreground/80">{view.summary}</p>
          ) : (
            <p className="text-[13.5px] italic text-muted-foreground">No summary yet.</p>
          )}
        </div>
      </Section>

      <Section title="Skills" count={skills.length}>
        <div className="rounded-2xl border p-4">
          <div className="flex flex-wrap gap-2">
            {view.technicalSkills.map((skill, i) =>
              skill.name ? (
                <span
                  key={`${skill.name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 py-1.5 pl-3 pr-2.5 text-[13px]"
                >
                  {skill.name}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeSkill(i)}
                      className="text-muted-foreground/60 transition-colors hover:text-foreground"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="size-3" strokeWidth={2.4} />
                    </button>
                  )}
                </span>
              ) : null
            )}
            {skills.length === 0 && !editing && (
              <span className="text-[13px] italic text-muted-foreground">No skills detected.</span>
            )}
          </div>
          {editing && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={skillInput}
                placeholder="Add a skill and press Enter"
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="max-w-64"
              />
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addSkill}>
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>
      </Section>

      {view.experience.length > 0 && (
        <Section
          icon={<Briefcase className="size-3.5 text-muted-foreground" />}
          title="Experience"
          count={view.experience.length}
        >
          <div className="flex flex-col gap-2.5">
            {view.experience.map((exp, i) => (
              <div key={i} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold">
                    {exp.role ?? "Role"}
                    {exp.company && (
                      <span className="font-normal text-muted-foreground"> · {exp.company}</span>
                    )}
                  </span>
                  {exp.duration && (
                    <span className="text-[11.5px] text-muted-foreground">{exp.duration}</span>
                  )}
                </div>
                {exp.work && exp.work.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.work.map((w, j) => (
                      <li
                        key={j}
                        className="flex gap-2 text-[12.5px] leading-snug text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {view.projects.length > 0 && (
        <Section
          icon={<FolderGit2 className="size-3.5 text-muted-foreground" />}
          title="Projects"
          count={view.projects.length}
        >
          <div className="flex flex-col gap-2.5">
            {view.projects.map((proj, i) => {
              const bullets = proj.about?.length ? proj.about : proj.readmeSummary ?? [];
              return (
                <div key={i} className="rounded-2xl border p-4">
                  <span className="text-sm font-semibold">{proj.name ?? "Untitled project"}</span>
                  {proj.skills && proj.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {proj.skills.map((s, j) => (
                        <span
                          key={j}
                          className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {bullets.length > 0 && (
                    <ul className="mt-2.5 space-y-1">
                      {bullets.slice(0, 3).map((b, j) => (
                        <li
                          key={j}
                          className="flex gap-2 text-[12.5px] leading-snug text-muted-foreground"
                        >
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {view.education.length > 0 && (
        <Section
          icon={<GraduationCap className="size-3.5 text-muted-foreground" />}
          title="Education"
          count={view.education.length}
        >
          <div className="overflow-hidden rounded-2xl border">
            {view.education.map((edu, i) => (
              <div
                key={i}
                className={
                  "flex items-start justify-between gap-3 px-4 py-3.5" +
                  (i < view.education.length - 1 ? " border-b" : "")
                }
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{edu.qualification ?? "—"}</div>
                  {edu.institution && (
                    <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {edu.institution}
                    </div>
                  )}
                </div>
                {edu.startingYear && (
                  <span className="shrink-0 text-[11.5px] text-muted-foreground">
                    {edu.startingYear}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {editing ? (
        <div className="mt-6 flex items-center justify-between gap-3 border-t pt-6">
          <Button type="button" variant="outline" size="lg" onClick={cancelEditing} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" size="lg" className="gap-2 px-6" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Button type="button" size="lg" className="h-13 w-full gap-2.5 text-[15.5px]" onClick={onStart}>
              <Sparkles className="size-[18px]" />
              Start interview
            </Button>
          </div>
          <div className="mt-6 flex justify-start border-t pt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2 px-5"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
