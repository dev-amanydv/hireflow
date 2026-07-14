import {
  BarChart3,
  Briefcase,
  Dumbbell,
  FileText,
  LayoutGrid,
  LogOut,
  MessagesSquare,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { Brand } from "./Brand";
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
import { useAuth } from "~/store/store";
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
      { to: "/dashboard/insights", label: "Insights", icon: BarChart3 },
    ],
  },
  {
    heading: "Account",
    items: [
      { to: "/dashboard/profile", label: "Profile", icon: User },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

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
          "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : "text-ink-subtle hover:bg-muted hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "size-4 shrink-0 transition-colors",
              isActive
                ? "text-primary"
                : "text-ink-tertiary group-hover:text-foreground"
            )}
          />
          {item.label}
        </>
      )}
    </NavLink>
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
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar",
        className
      )}
    >
      <div className="flex h-14 items-center px-5">
        <Brand to="/" />
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
                  key={item.to}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-border p-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-subtle transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4 shrink-0 text-ink-tertiary transition-colors group-hover:text-foreground" />
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
