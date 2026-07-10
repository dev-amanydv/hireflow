import { Link, useNavigate } from "react-router";
import { useAuth } from "~/store/store";
import { Brand } from "./Brand";
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

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-sm text-ink-subtle sm:inline">
              {user.email}
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => {
                removeUser();
                navigate("/");
              }}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuthModal({ mode: "signin" })}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-subtle transition-colors hover:text-foreground"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => openAuthModal({ mode: "signup" })}
              className="rounded-md bg-white px-3.5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
