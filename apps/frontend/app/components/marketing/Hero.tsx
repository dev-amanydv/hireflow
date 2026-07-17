import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import InterviewStage from "./InterviewStage";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-90"
        style={{
          background:
            "radial-gradient(55% 90% at 68% 0%, var(--glow-brand), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-8 sm:px-8 sm:pt-24 lg:pt-28 lg:pb-16">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8">
          {/* Left — typography + CTA */}
          <div className="flex flex-col gap-6">
            <span
              className="ln-rise inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-1 text-[12.5px] text-ink-muted"
              style={{ animationDelay: "20ms" }}
            >
              <span className="relative grid size-2 place-items-center">
                <span
                  className="absolute size-2 rounded-full opacity-60 ln-stage-pulse"
                  style={{ background: "var(--success)" }}
                />
                <span className="relative size-1 rounded-full" style={{ background: "var(--success)" }} />
              </span>
              Live AI voice interviews
            </span>

            <h1
              className="ln-rise ln-display-xl text-foreground"
              style={{ animationDelay: "60ms" }}
            >
              The AI interviewer,
              <br className="hidden sm:block" /> built for the AI era
            </h1>

            <p
              className="ln-rise max-w-lg text-lg leading-relaxed text-ink-subtle"
              style={{ animationDelay: "140ms" }}
            >
              Hireflow reads your resume, GitHub, and code — then runs a real
              voice interview and scores it instantly. Practice like it's the
              real thing.
            </p>

            <div
              className="ln-rise flex flex-wrap items-center gap-4"
              style={{ animationDelay: "220ms" }}
            >
              <button
                type="button"
                onClick={() => navigate("/dashboard/overview")}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
              >
                Start practicing free
                <ArrowRight className="size-4" />
              </button>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 text-sm text-ink-subtle transition-colors hover:text-foreground"
              >
                See how it works
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          {/* Right — live interview illustration */}
          <div className="ln-rise" style={{ animationDelay: "320ms" }}>
            <InterviewStage />
          </div>
        </div>
      </div>
    </section>
  );
}
