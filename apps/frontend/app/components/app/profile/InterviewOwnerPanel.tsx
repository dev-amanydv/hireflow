import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { gradientFor, initialsFor } from "./identicon";
import type { PublicInterviewOwner } from "./types";

function formatMinutes(total: number): string {
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
      <span className="ln-mono text-lg font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[11px] text-ink-tertiary">{label}</span>
    </div>
  );
}

export function InterviewOwnerPanel({ owner }: { owner: PublicInterviewOwner }) {
  const name = owner.displayName || owner.username;
  const initials = useMemo(() => initialsFor(name), [name]);
  const gradient = useMemo(() => gradientFor(owner.username), [owner.username]);

  return (
    <div className="ln-lift flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={name} />}
          <AvatarFallback className="text-sm font-semibold text-white" style={{ background: gradient }}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs font-medium text-primary">@{owner.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Interviews" value={String(owner.totalInterviews)} />
        <Stat label="Minutes practiced" value={formatMinutes(owner.minutesPracticed)} />
      </div>

      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link to={`/u/${owner.username}`}>
          View profile
          <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

export function InterviewOwnerPanelSkeleton() {
  return (
    <div className="ln-lift flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer size-12 shrink-0 rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
          <div className="skeleton-shimmer h-3 w-16 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="skeleton-shimmer h-14 rounded-xl bg-muted" />
        <div className="skeleton-shimmer h-14 rounded-xl bg-muted" />
      </div>
      <div className="skeleton-shimmer h-9 rounded-md bg-muted" />
    </div>
  );
}
