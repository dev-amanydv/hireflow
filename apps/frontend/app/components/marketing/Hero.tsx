import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "~/store/store";
import HeroMockup from "./HeroMockup";

export default function Hero() {
  const navigate = useNavigate();
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const user = useAuth((s) => s.user);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(94,106,210,0.10), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
        <div className="flex flex-col gap-6">
          <h1 className="ln-rise ln-display-xl max-w-3xl text-foreground" style={{ animationDelay: "40ms" }}>
            The AI interviewer,
            <br className="hidden sm:block" /> built for the AI era
          </h1>

          <div
            className="ln-rise flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
            style={{ animationDelay: "140ms" }}
          >
            <p className="max-w-xl text-lg leading-relaxed text-ink-subtle">
              Practice interviews that feel real. Sable reads your resume, GitHub,
              and code — then runs an adaptive interview and scores it instantly.
            </p>
            <a
              href="#features"
              className="group inline-flex shrink-0 items-center gap-2 text-sm text-ink-subtle transition-colors hover:text-foreground"
            >
              <span className="text-foreground">New</span> Instant AI scoring
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="ln-rise flex flex-wrap items-center gap-3" style={{ animationDelay: "220ms" }}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              Start practicing free
              <ArrowRight className="size-4" />
            </button>
            {!user && (
              <button
                type="button"
                onClick={() => openAuthModal({ mode: "signin", onSuccess: () => navigate("/dashboard") })}
                className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Log in
              </button>
            )}
          </div>
        </div>

        <div className="ln-rise mt-14" style={{ animationDelay: "320ms" }}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
