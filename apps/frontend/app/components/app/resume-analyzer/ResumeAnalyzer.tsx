import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import EmptyState from "../EmptyState";
import { InputFile } from "~/components/pre-interview/ui/file-upload";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";
import ReportView from "./ReportView";
import {
  EXPERIENCE_OPTIONS,
  ROLE_OPTIONS,
  type AnalysisListItem,
  type AnalysisReport,
  type AnalysisRow,
} from "./types";

type View = "list" | "upload" | "parsing" | "target" | "scoring" | "report";

const POLL_MS = 3000;
// The judge runs gpt-5-mini at medium reasoning effort (~1–2 min). Ceiling of
// ~5 min leaves a comfortable buffer so the poll never abandons a live score.
const POLL_MAX = 100;

function Header({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ln-eyebrow">Preparation</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ln-display-md text-balance text-foreground">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-subtle">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

function scoreBadgeTone(score: number | null) {
  if (score == null) return "text-ink-tertiary";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function ResumeAnalyzer() {
  const [view, setView] = useState<View>("list");
  const [list, setList] = useState<AnalysisListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [jdText, setJdText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/resume`, { withCredentials: true });
      setList(res.data?.data?.analyses ?? []);
    } catch {
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if ((view !== "parsing" && view !== "scoring") || !currentId) return;
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await axios.get(`${BACKEND_URL}/resume/${currentId}/status`, { withCredentials: true });
        const data = res.data?.data ?? {};
        if (data.failed) {
          toast.error("Analysis failed. Please try another file.");
          setView("list");
          fetchList();
          return;
        }
        if (view === "parsing" && data.parsed) {
          setView("target");
          return;
        }
        if (view === "scoring" && data.ready) {
          const full = await axios.get(`${BACKEND_URL}/resume/${currentId}`, { withCredentials: true });
          const row: AnalysisRow = full.data?.data?.analysis;
          setReport(row?.report ?? null);
          setView("report");
          fetchList();
          return;
        }
      } catch {
      }
      if (attempts >= POLL_MAX) {
        toast.error("This is taking longer than expected. Check back shortly.");
        setView("list");
        fetchList();
        return;
      }
      pollRef.current = setTimeout(tick, POLL_MS);
    };

    pollRef.current = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [view, currentId, fetchList]);

  const startNew = () => {
    setCurrentId(null);
    setReport(null);
    setRole("");
    setExperience("");
    setJdText("");
    setView("upload");
  };

  const openAnalysis = async (item: AnalysisListItem) => {
    if (item.status !== "COMPLETE") {
      setCurrentId(item.id);
      setView(item.status === "PARSED" ? "target" : "parsing");
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_URL}/resume/${item.id}`, { withCredentials: true });
      const row: AnalysisRow = res.data?.data?.analysis;
      setCurrentId(item.id);
      setReport(row?.report ?? null);
      setView("report");
    } catch {
      toast.error("Couldn't load that analysis.");
    }
  };

  const submitTarget = async () => {
    if (!currentId || !role) return;
    setSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/resume/${currentId}/target`,
        { role, ...(experience ? { experience } : {}), ...(jdText.trim() ? { jdText: jdText.trim() } : {}) },
        { withCredentials: true },
      );
      setView("scoring");
    } catch {
      toast.error("Couldn't start scoring. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  if (view === "upload") {
    return (
      <div className="flex flex-col gap-8">
        <Header title="Analyze resume" description="Upload your resume as a PDF. We parse it, then score it against a target role and (optionally) a job description." />
        <button type="button" onClick={() => setView("list")} className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-subtle hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="max-w-xl">
          <InputFile
            uploadUrl={`${BACKEND_URL}/resume/upload`}
            requireInterviewId={false}
            accept=".pdf"
            hint="PDF only (max. 5MB)"
            onUploaded={(data) => {
              const id = (data as { id?: string } | undefined)?.id;
              if (!id) {
                toast.error("Upload failed.");
                return;
              }
              setCurrentId(id);
              setView("parsing");
            }}
          />
        </div>
      </div>
    );
  }

  if (view === "parsing" || view === "scoring") {
    const parsing = view === "parsing";
    return (
      <div className="flex flex-col gap-8">
        <Header title="Analyze resume" description={parsing ? "Reading your resume and extracting your experience…" : "Scoring your resume against the target…"} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">{parsing ? "Parsing resume" : "Running the analysis"}</p>
          <p className="max-w-sm text-sm text-ink-subtle">
            {parsing
              ? "Extracting text, sections, and any linked GitHub work. This usually takes 10–30 seconds."
              : "Running deterministic ATS checks plus an AI content review. This usually takes a minute or two — it keeps running even if you leave, and the result appears in your history."}
          </p>
        </div>
      </div>
    );
  }

  if (view === "target") {
    return (
      <div className="flex flex-col gap-8">
        <Header title="Set your target" description="The score is job-aware — tell us the role you're aiming for. Paste a job description for the sharpest keyword match." />
        <div className="ln-lift flex max-w-2xl flex-col gap-5 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-subtle">Target role *</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <option value="">Select a role…</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-subtle">Experience level</span>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <option value="">Any / unspecified</option>
                {EXPERIENCE_OPTIONS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-subtle">Job description <span className="text-ink-tertiary">(optional — paste for a precise keyword-gap analysis)</span></span>
            <Textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job posting here…"
              className="min-h-32"
            />
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={submitTarget} disabled={!role || submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyze my resume
            </Button>
            <button type="button" onClick={() => setView("list")} className="text-sm text-ink-subtle hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "report") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => { setView("list"); fetchList(); }} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-foreground">
            <ArrowLeft className="size-4" /> All analyses
          </button>
          <Button variant="outline" onClick={startNew}>
            Analyze another <ArrowRight className="size-4" />
          </Button>
        </div>
        {report ? (
          <ReportView report={report} />
        ) : (
          <EmptyState icon={FileText} title="Report unavailable" description="This analysis didn't produce a report. Try running it again." />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Header
        title="Analyze resume"
        description="Get an authentic, job-aware ATS score with a transparent breakdown and concrete, evidence-backed fixes."
        action={
          <Button onClick={startNew}>
            <Sparkles className="size-4" /> New analysis
          </Button>
        }
      />

      {listLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-20 text-sm text-ink-subtle">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No analyses yet"
          description="Upload your resume to get an ATS score, a category-by-category breakdown, a keyword-gap analysis against your target job, and specific rewrite suggestions."
          action={
            <Button variant="outline" onClick={startNew}>
              Analyze your resume <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openAnalysis(item)}
              className="ln-lift group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-ink-subtle">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="truncate text-xs text-ink-subtle">
                  {item.targetRole ?? "No target set"} ·{" "}
                  {item.status === "COMPLETE" ? "Complete" : item.status === "FAILED" ? "Failed" : "In progress"}
                </p>
              </div>
              <div className="text-right">
                <span className={cn("ln-mono text-xl font-semibold tabular-nums", scoreBadgeTone(item.overallScore))}>
                  {item.overallScore ?? "—"}
                </span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-ink-tertiary transition-colors group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
