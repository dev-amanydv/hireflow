import { useNavigate } from "react-router";
import { Brand } from "~/components/app/Brand";
import { ThemeToggle } from "~/components/app/ThemeToggle";

const LINKS = ["Product", "How it works", "Pricing", "Company"];

export default function LandingNav() {
  const navigate = useNavigate();

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
          <button
            type="button"
            onClick={() => navigate("/dashboard/overview")}
            className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            Continue
          </button>
        </div>
      </div>
    </header>
  );
}
