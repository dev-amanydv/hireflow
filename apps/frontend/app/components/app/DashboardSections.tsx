import {
  ArrowRight,
  BarChart3,
  FileText,
  MessagesSquare,
  Settings,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import EmptyState from "./EmptyState";
import type { DashboardSection } from "./DashboardSidebar";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/store/store";
import { useStartInterview } from "~/lib/useStartInterview";

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ln-eyebrow">{eyebrow}</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ln-display-md text-foreground text-balance">{title}</h1>
          {description && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-subtle">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

/**
 * The workspace's one "Committed" moment: a saturated indigo action surface
 * that anchors the primary task (start an interview). Everything else on the
 * dashboard stays restrained neutral so this reads as the clear next step.
 */
function StartInterviewHero() {
  const startInterview = useStartInterview();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
      {/* soft, non-glass highlight — a single radial, not a decorative blur */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, white 22%, transparent), transparent)",
        }}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium tracking-wide">
              Tailored to your real work
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            Ready when you are
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/80">
            Pick a role, add your resume, and Sable builds an adaptive interview
            from your history — then scores it the moment you finish.
          </p>
        </div>
        <button
          type="button"
          onClick={startInterview}
          className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-white/90 sm:self-auto"
        >
          Start new interview
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact stat strip — a single card with internal dividers, deliberately not
 * three identical cards. Numerals use the mono face (an ownable Sable detail).
 */
function StatStrip({
  stats,
}: {
  stats: { label: string; value: string; hint: string }[];
}) {
  return (
    <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <p className="text-xs text-ink-tertiary">{s.label}</p>
          <p className="ln-mono mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
            {s.value}
          </p>
          <p className="mt-0.5 text-xs text-ink-tertiary">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}

function Overview() {
  const startInterview = useStartInterview();

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Workspace"
        title="Welcome back"
        description="Your interview activity at a glance. Start a session and your progress builds up here."
      />

      <StartInterviewHero />

      <StatStrip
        stats={[
          { label: "Interviews", value: "0", hint: "No sessions yet" },
          { label: "Best score", value: "—", hint: "Awaiting first result" },
          { label: "Avg. score", value: "—", hint: "Awaiting first result" },
        ]}
      />

      <EmptyState
        icon={Sparkles}
        title="No activity yet"
        description="Pick a role, upload your resume, and Sable builds a tailored interview from your real work — your history and scores show up here."
        action={
          <Button variant="outline" onClick={startInterview}>
            Start new interview
            <ArrowRight className="size-4" />
          </Button>
        }
      />
    </div>
  );
}

function Interviews() {
  const startInterview = useStartInterview();
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="History"
        title="Past interviews"
        description="Every completed session, its transcript, and its score — all in one place."
        action={
          <Button onClick={startInterview}>
            <Sparkles className="size-4" />
            Start new interview
          </Button>
        }
      />
      <EmptyState
        icon={MessagesSquare}
        title="No interviews yet"
        description="Once you complete an interview, it lands here with the full transcript and a detailed breakdown you can revisit anytime."
        action={
          <Button variant="outline" onClick={startInterview}>
            Start your first interview
            <ArrowRight className="size-4" />
          </Button>
        }
      />
    </div>
  );
}

function Resume() {
  const startInterview = useStartInterview();
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Preparation"
        title="Analyze resume"
        description="Upload your resume and Sable extracts your experience, projects, and GitHub work to tailor every question."
        action={
          <Button onClick={startInterview}>
            <Upload className="size-4" />
            Upload resume
          </Button>
        }
      />
      <EmptyState
        icon={FileText}
        title="No resume analyzed"
        description="Add your resume to get a breakdown of highlighted skills, notable projects, and the topics your interview is likely to cover."
        action={
          <Button variant="outline" onClick={startInterview}>
            Upload a resume
            <ArrowRight className="size-4" />
          </Button>
        }
      />
    </div>
  );
}

function Insights() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Analytics"
        title="Insights"
        description="Track how your scores trend over time and where your strongest and weakest topics are."
      />
      <EmptyState
        icon={BarChart3}
        title="Not enough data yet"
        description="Complete a few interviews and Sable charts your score trend, strengths by topic, and areas to focus on next."
      />
    </div>
  );
}

function Profile() {
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Account"
        title="Profile"
        description="Your account details and connected sources."
      />
      {user ? (
        <div className="ln-lift max-w-2xl rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {user.email.split("@")[0]}
              </p>
              <p className="truncate text-sm text-ink-subtle">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <div className="bg-card p-4">
              <p className="text-xs text-ink-tertiary">Connected GitHub</p>
              <p className="mt-1 text-sm text-ink-subtle">Not connected</p>
            </div>
            <div className="bg-card p-4">
              <p className="text-xs text-ink-tertiary">Connected LinkedIn</p>
              <p className="mt-1 text-sm text-ink-subtle">Not connected</p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={User}
          title="You're not signed in"
          description="Sign in to save your interview history, track your scores, and connect your GitHub and LinkedIn."
          action={
            <Button
              variant="outline"
              onClick={() => openAuthModal({ mode: "signin" })}
            >
              Sign in
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Account"
        title="Settings"
        description="Manage preferences, notifications, and connected accounts."
      />
      <EmptyState
        icon={Settings}
        title="Nothing to configure yet"
        description="Interview preferences, notification controls, and integrations will live here as they become available."
      />
    </div>
  );
}

export default function DashboardSections({
  section,
}: {
  section: DashboardSection;
}) {
  switch (section) {
    case "overview":
      return <Overview />;
    case "interviews":
      return <Interviews />;
    case "resume":
      return <Resume />;
    case "insights":
      return <Insights />;
    case "profile":
      return <Profile />;
    case "settings":
      return <SettingsSection />;
  }
}
