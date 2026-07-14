import { useNavigate } from "react-router";
import { useAuth } from "~/store/store";
import { Brand } from "~/components/app/Brand";
import { ThemeToggle } from "~/components/app/ThemeToggle";

const LINKS = ["Product", "How it works", "Pricing", "Company"];

export default function LandingNav() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Brand to="/" />

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l}
              href="#features"
              className="text-sm text-ink-subtle transition-colors hover:text-foreground"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  openAuthModal({ mode: "signin", onSuccess: () => navigate("/dashboard") })
                }
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-subtle transition-colors hover:text-foreground"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() =>
                  openAuthModal({ mode: "signup", onSuccess: () => navigate("/dashboard") })
                }
                className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
