import {
  Briefcase,
  Dumbbell,
  FileText,
  Flame,
  LayoutGrid,
  LogOut,
  MessagesSquare,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { Brand } from "./Brand";
import { bandMeta } from "./resume-analyzer/scoring";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { ScoreBar } from "~/components/ui/score-bar";
import { useAuth, useSidebarStats } from "~/store/store";
import { useStartInterview } from "~/lib/useStartInterview";
import { cn } from "~/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Workspace",
    items: [
      { to: "/dashboard/overview", label: "Overview", icon: LayoutGrid },
      { to: "/dashboard/practice", label: "Practice", icon: Dumbbell },
      { to: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
      {
        to: "/dashboard/interviews",
        label: "Past interviews",
        icon: MessagesSquare,
      },
      { to: "/dashboard/resume", label: "Analyze resume", icon: FileText },
    ],
  },
  {
    heading: "Account",
    items: [{ to: "/dashboard/profile", label: "Profile", icon: User }],
  },
];

const ROW =
  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] leading-5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const ROW_IDLE =
  "font-medium text-ink-subtle hover:bg-sidebar-accent hover:text-sidebar-foreground";
const ICON = "size-[18px] shrink-0 transition-colors duration-150";

function NavButton({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          ROW,
          isActive
            ? "bg-sidebar-selected font-semibold text-sidebar-foreground"
            : ROW_IDLE
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              ICON,
              isActive
                ? "text-primary"
                : "text-ink-tertiary group-hover:text-sidebar-foreground"
            )}
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

function StatsFooter() {
  const user = useAuth((s) => s.user);
  const stats = useSidebarStats((s) => s.stats);
  const status = useSidebarStats((s) => s.status);
  const load = useSidebarStats((s) => s.load);

  useEffect(() => {
    if (user) load(user.userId);
  }, [user, load]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="rounded-xl border border-sidebar-border p-3">
        <div className="skeleton-shimmer h-3.5 w-full rounded bg-sidebar-accent" />
        <div className="skeleton-shimmer mt-3 h-1 w-full rounded-full bg-sidebar-accent" />
        <div className="skeleton-shimmer mt-3 h-3 w-2/3 rounded bg-sidebar-accent" />
      </div>
    );
  }

  if (status === "error" || !stats) return null;

  if (stats.totalInterviews === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sidebar-border p-3">
        <p className="text-[13px] font-medium text-sidebar-foreground">
          No interviews yet
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-tertiary">
          Your average score shows up here once you finish the first one.
        </p>
      </div>
    );
  }

  const { avgScore, totalInterviews, currentStreak } = stats;
  const meta = bandMeta(avgScore);

  return (
    <Link
      to="/dashboard/profile"
      className="block rounded-xl border border-sidebar-border p-3 outline-none transition-colors duration-150 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-subtle">
          Avg score
        </span>
        <span
          className={cn(
            "ln-mono text-lg font-semibold tabular-nums",
            avgScore == null ? "text-ink-tertiary" : meta.text
          )}
        >
          {avgScore == null ? "—" : Math.round(avgScore)}
        </span>
      </div>

      {avgScore == null ? (
        <p className="mt-1.5 text-xs text-ink-tertiary">
          Scoring still in progress.
        </p>
      ) : (
        <ScoreBar
          value={avgScore}
          tone={meta.fill}
          height="h-1"
          className="mt-2.5 bg-sidebar-selected"
        />
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-ink-tertiary">
        <span className="tabular-nums">
          {totalInterviews} interview{totalInterviews === 1 ? "" : "s"}
        </span>
        {currentStreak > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 tabular-nums">
              <Flame className="size-3 shrink-0" aria-hidden="true" />
              {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

export default function DashboardSidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const removeUser = useAuth((s) => s.removeUser);
  const startInterview = useStartInterview();

  return (
    <aside
      className={cn(
        "flex h-full w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      <div className="flex h-14 shrink-0 items-center px-5">
        <Brand to="/" />
      </div>

      <div className="shrink-0 px-3 pb-3 pt-1">
        <Button
          onClick={startInterview}
          size="lg"
          className="w-full justify-center text-[15px]"
        >
          <Sparkles className="size-[18px]" />
          Start new interview
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mb-6 last:mb-0">
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.06em] text-ink-subtle">
              {group.heading}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavButton key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
          <StatsFooter />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={cn(ROW, ROW_IDLE)}>
                <LogOut
                  className={cn(
                    ICON,
                    "text-ink-tertiary group-hover:text-sidebar-foreground"
                  )}
                />
                Log out
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You&apos;ll be signed out of your account and returned to the
                  home page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    removeUser();
                    navigate("/");
                  }}
                >
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </aside>
  );
}
