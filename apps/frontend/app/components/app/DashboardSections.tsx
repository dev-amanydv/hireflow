import {
  ArrowRight,
  BarChart3,
  FileText,
  MessagesSquare,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EmptyState from "./EmptyState";
import type { DashboardSection } from "./DashboardSidebar";
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
          <h1 className="ln-display-md text-foreground">{title}</h1>
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

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="ln-lift rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-subtle">{label}</span>
        <Icon className="size-4 text-ink-tertiary" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-tertiary">{hint}</p>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}

function Overview() {
  const startInterview = useStartInterview();
  const user = useAuth((s) => s.user);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Workspace"
        title={user ? `Welcome back` : "Welcome"}
        description="Your interview activity at a glance. Start a session to see your progress build up here."
        action={
          <PrimaryButton onClick={startInterview}>
            <Sparkles className="size-4" />
            Start new interview
          </PrimaryButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={MessagesSquare}
          label="Interviews"
          value="0"
          hint="No sessions yet"
        />
        <StatCard
          icon={Target}
          label="Best score"
          value="—"
          hint="Awaiting first result"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. score"
          value="—"
          hint="Awaiting first result"
        />
      </div>

      <EmptyState
        icon={Sparkles}
        title="No activity yet"
        description="Pick a role, upload your resume, and Sable builds a tailored interview from your real work — your history and scores show up here."
        action={
          <GhostButton onClick={startInterview}>
            Start new interview
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </GhostButton>
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
          <PrimaryButton onClick={startInterview}>
            <Sparkles className="size-4" />
            Start new interview
          </PrimaryButton>
        }
      />
      <EmptyState
        icon={MessagesSquare}
        title="No interviews yet"
        description="Once you complete an interview, it lands here with the full transcript and a detailed breakdown you can revisit anytime."
        action={
          <GhostButton onClick={startInterview}>
            Start your first interview
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </GhostButton>
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
          <PrimaryButton onClick={startInterview}>
            <Upload className="size-4" />
            Upload resume
          </PrimaryButton>
        }
      />
      <EmptyState
        icon={FileText}
        title="No resume analyzed"
        description="Add your resume to get a breakdown of highlighted skills, notable projects, and the topics your interview is likely to cover."
        action={
          <GhostButton onClick={startInterview}>
            Upload a resume
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </GhostButton>
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
        <div className="ln-lift max-w-2xl rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {user.email.split("@")[0]}
              </p>
              <p className="truncate text-sm text-ink-subtle">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
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
            <GhostButton onClick={() => openAuthModal({ mode: "signin" })}>
              Sign in
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </GhostButton>
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
