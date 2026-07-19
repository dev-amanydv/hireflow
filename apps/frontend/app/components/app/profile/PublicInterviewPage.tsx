import { useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { ArrowLeft, FileQuestion } from "lucide-react";
import EmptyState from "../EmptyState";
import RecordingPlayer from "../RecordingPlayer";
import { InterviewOwnerPanel, InterviewOwnerPanelSkeleton } from "./InterviewOwnerPanel";
import { InterviewVisibilityBanner } from "./InterviewVisibilityBanner";
import { BACKEND_URL } from "~/lib/config";
import type { PublicInterviewData } from "./types";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
};

const SKILL_LABEL: Record<string, string> = {
  react: "React",
  nodejs: "Node.js",
  "system-design": "System Design",
  "sql-databases": "SQL & Databases",
  javascript: "JavaScript",
  python: "Python",
  dsa: "DSA",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function PublicInterviewPage({
  username,
  interviewId,
}: {
  username: string;
  interviewId: string;
}) {
  const [data, setData] = useState<PublicInterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/profile/${username}/interview/${interviewId}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (!cancelled) setData(res.data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, interviewId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-5">
        <EmptyState
          icon={FileQuestion}
          title="Interview not found"
          description="This interview isn't public, or the link is incorrect."
          action={
            <Link
              to={`/u/${username}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to profile
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 sm:px-8">
      <Link
        to={`/u/${username}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to @{username}
      </Link>

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="ln-lift flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="skeleton-shimmer h-6 w-48 rounded bg-muted" />
            <div className="skeleton-shimmer h-40 rounded-lg bg-muted" />
          </div>
          <InterviewOwnerPanelSkeleton />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {data.isOwner && (
            <InterviewVisibilityBanner
              interviewId={interviewId}
              isPublic={data.isPublic}
              onChange={(next) =>
                setData((prev) => (prev ? { ...prev, isPublic: next } : prev))
              }
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="ln-display-md text-foreground">{data.jobRole}</h1>
                <p className="mt-1.5 text-sm text-ink-subtle">
                  {data.skill ? SKILL_LABEL[data.skill] ?? data.skill : "Behavioral"} ·{" "}
                  {LEVEL_LABEL[data.experience] ?? data.experience} · {formatDate(data.createdAt)}
                </p>
              </div>
              <RecordingPlayer
                interviewId={interviewId}
                status={data.recordingStatus}
                durationMs={data.durationMs}
                recordingUrl={data.recordingUrl}
                allowDownload={false}
              />
            </div>
            <InterviewOwnerPanel owner={data.owner} />
          </div>
        </div>
      )}
    </div>
  );
}
