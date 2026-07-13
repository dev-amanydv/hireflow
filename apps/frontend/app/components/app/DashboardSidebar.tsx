import {
  BarChart3,
  Briefcase,
  FileText,
  LayoutGrid,
  LogOut,
  MessagesSquare,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/store/store";
import { useStartInterview } from "~/lib/useStartInterview";
import { cn } from "~/lib/utils";

export type DashboardSection =
  | "overview"
  | "jobs"
  | "interviews"
  | "resume"
  | "insights"
  | "profile"
  | "settings";

type NavItem = {
  id: DashboardSection;
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
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "jobs", label: "Jobs", icon: Briefcase },
      { id: "interviews", label: "Past interviews", icon: MessagesSquare },
      { id: "resume", label: "Analyze resume", icon: FileText },
      { id: "insights", label: "Insights", icon: BarChart3 },
    ],
  },
  {
    heading: "Account",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (id: DashboardSection) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-ink-subtle hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-ink-tertiary group-hover:text-foreground"
        )}
      />
      {item.label}
    </button>
  );
}

export default function DashboardSidebar({
  active,
  onSelect,
  className,
}: {
  active: DashboardSection;
  onSelect: (id: DashboardSection) => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const removeUser = useAuth((s) => s.removeUser);
  const startInterview = useStartInterview();

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-5">
        <Brand to="/" />
        <ThemeToggle className="-mr-2" />
      </div>

      <div className="px-3 pb-2 pt-1">
        <Button onClick={startInterview} className="w-full justify-center">
          <Sparkles className="size-4" />
          Start new interview
        </Button>
      </div>

      <nav className="flex-1 overflow-hidden px-3 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mb-5 last:mb-0">
            <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
              {group.heading}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={active === item.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.email.split("@")[0]}
              </p>
              <p className="truncate text-xs text-ink-tertiary">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                removeUser();
                navigate("/");
              }}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
