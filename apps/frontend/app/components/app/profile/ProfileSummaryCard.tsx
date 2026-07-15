import { Briefcase, FileText, GraduationCap } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import EmptyState from "../EmptyState";
import type { ParsedSummary } from "./types";

export function ProfileSummaryCard({ summary }: { summary: ParsedSummary | null }) {
  if (!summary) {
    return (
      <EmptyState
        icon={FileText}
        title="No resume summary yet"
        description="This person hasn't uploaded a resume to their profile."
      />
    );
  }

  const skills = summary.technicalSkills.filter((s) => s.name);
  const experience = summary.experience.filter((e) => e.role || e.company);
  const education = summary.education.filter((e) => e.qualification || e.institution);

  return (
    <div className="ln-lift flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
      {(summary.role || summary.summary) && (
        <div>
          {summary.role && (
            <h3 className="text-base font-semibold text-foreground">{summary.role}</h3>
          )}
          {summary.summary && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-subtle">{summary.summary}</p>
          )}
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <span className="ln-eyebrow">Skills</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <Badge key={`${skill.name}-${i}`} variant="secondary">
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div>
          <span className="ln-eyebrow flex items-center gap-1.5">
            <Briefcase className="size-3.5" />
            Experience
          </span>
          <div className="mt-3 flex flex-col gap-4">
            {experience.map((exp, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-foreground">
                  {exp.role}
                  {exp.company && <span className="text-ink-subtle"> · {exp.company}</span>}
                </p>
                {exp.duration && (
                  <p className="mt-0.5 text-xs text-ink-tertiary">{exp.duration}</p>
                )}
                {exp.work && exp.work.length > 0 && (
                  <ul className="mt-1.5 flex flex-col gap-1 text-xs leading-relaxed text-ink-subtle">
                    {exp.work.map((line, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="text-ink-tertiary">·</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div>
          <span className="ln-eyebrow flex items-center gap-1.5">
            <GraduationCap className="size-3.5" />
            Education
          </span>
          <div className="mt-3 flex flex-col gap-2.5">
            {education.map((edu, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-foreground">{edu.qualification}</p>
                <p className="text-xs text-ink-tertiary">
                  {edu.institution}
                  {edu.startingYear ? ` · ${edu.startingYear}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileSummaryCardSkeleton() {
  return (
    <div className="ln-lift flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="skeleton-shimmer h-5 w-40 rounded bg-muted" />
      <div className="skeleton-shimmer h-4 w-full rounded bg-muted" />
      <div className="skeleton-shimmer h-4 w-2/3 rounded bg-muted" />
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-5 w-16 rounded-full bg-muted" />
        ))}
      </div>
    </div>
  );
}
