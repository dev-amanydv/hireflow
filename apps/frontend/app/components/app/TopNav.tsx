import { Link, useNavigate } from "react-router";
import { useAuth } from "~/store/store";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function TopNav({ className }: { className?: string }) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const removeUser = useAuth((s) => s.removeUser);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-14 w-full border-b border-border bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-6">
          <Brand to="/" />
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              to="/dashboard"
              className="text-sm text-ink-subtle transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/start"
              className="text-sm text-ink-subtle transition-colors hover:text-foreground"
            >
              New interview
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[180px] truncate text-sm text-ink-subtle sm:inline">
                {user.email}
              </span>
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {user.email.slice(0, 1).toUpperCase()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  removeUser();
                  navigate("/");
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal({ mode: "signin" })}
              >
                Log in
              </Button>
              <Button size="sm" onClick={() => openAuthModal({ mode: "signup" })}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
