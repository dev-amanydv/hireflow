import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MessagesSquare,
  Search,
  Settings,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import EmptyState from "./EmptyState";
import type { DashboardSection } from "./DashboardSidebar";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/store/store";
import { useStartInterview } from "~/lib/useStartInterview";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

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
          <h1 className="ln-display-md text-foreground text-balance">
            {title}
          </h1>
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
            Pick a role, add your resume, and QuickHire builds an adaptive
            interview from your history — then scores it the moment you finish.
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
        description="Once you complete a session, your interview history, transcripts, and scores collect here so you can track how you improve over time."
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
        description="Upload your resume and QuickHire extracts your experience, projects, and GitHub work to tailor every question."
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
        description="Complete a few interviews and QuickHire charts your score trend, strengths by topic, and areas to focus on next."
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

type Job = {
  id: string;
  source: "REMOTIVE" | "ARBEITNOW" | "ADZUNA";
  title: string;
  company: string;
  companyLogo: string | null;
  location: string | null;
  remote: boolean;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "OTHER";
  description: string;
  tags: string[];
  url: string;
  postedAt: string | null;
};

const JOB_TYPE_LABELS: Record<Job["jobType"], string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  OTHER: "Other",
};

const PAGE_SIZE = 20;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function JobCard({ job }: { job: Job }) {
  const posted = timeAgo(job.postedAt);
  const snippet = stripHtml(job.description);
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ln-lift group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt=""
            className="size-10 shrink-0 rounded-lg border border-border object-contain"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-semibold text-ink-subtle">
            {job.company.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {job.title}
          </h3>
          <p className="truncate text-sm text-ink-subtle">{job.company}</p>
        </div>
        <ExternalLink className="size-4 shrink-0 text-ink-tertiary transition-colors group-hover:text-primary" />
      </div>

      {snippet && (
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-subtle">
          {snippet}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {job.remote && <Badge variant="secondary">Remote</Badge>}
        {job.jobType !== "OTHER" && (
          <Badge variant="outline">{JOB_TYPE_LABELS[job.jobType]}</Badge>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-tertiary">
            <MapPin className="size-3" />
            {job.location}
          </span>
        )}
        {posted && (
          <span className="ml-auto text-xs text-ink-tertiary">{posted}</span>
        )}
      </div>
    </a>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {children}
    </select>
  );
}

function Jobs() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, remoteOnly, type, source]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedQuery) params.q = debouncedQuery;
    if (remoteOnly) params.remote = true;
    if (type) params.type = type;
    if (source) params.source = source;

    axios
      .get(`${BACKEND_URL}/jobs`, { params, withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? {};
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setJobs([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, remoteOnly, type, source, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Opportunities"
        title="Jobs"
        description="Software-engineering roles aggregated from top sources. Click any role to apply on the original site."
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, company, or tag…"
              className="pl-9"
            />
          </div>

          <button
            type="button"
            onClick={() => setRemoteOnly((v) => !v)}
            aria-pressed={remoteOnly}
            className={cn(
              "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
              remoteOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-ink-subtle hover:text-foreground",
            )}
          >
            Remote only
          </button>

          <FilterSelect value={type} onChange={setType} label="Job type">
            <option value="">All types</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </FilterSelect>

          <FilterSelect value={source} onChange={setSource} label="Source">
            <option value="">All sources</option>
            <option value="REMOTIVE">Remotive</option>
            <option value="ARBEITNOW">Arbeitnow</option>
            <option value="ADZUNA">Adzuna</option>
          </FilterSelect>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-20 text-sm text-ink-subtle">
          <Loader2 className="size-4 animate-spin" />
          Loading jobs…
        </div>
      ) : error ? (
        <EmptyState
          icon={Briefcase}
          title="Couldn't load jobs"
          description="Something went wrong fetching listings. Please try again in a moment."
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matching jobs"
          description="No roles match your filters right now. Try broadening your search or clearing filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-tertiary">
              {total} role{total === 1 ? "" : "s"} · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
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
    case "jobs":
      return <Jobs />;
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
