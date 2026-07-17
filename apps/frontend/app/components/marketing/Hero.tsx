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
        <h1
          className="ln-rise ln-display-xl max-w-4xl text-foreground"
          style={{ animationDelay: "0ms" }}
        >
          The AI interviewer,
          <br className="hidden sm:block" /> built for the AI era
        </h1>

        <div
          className="ln-rise mt-6 flex flex-col gap-4 sm:mt-7 sm:flex-row sm:items-end sm:justify-between"
          style={{ animationDelay: "90ms" }}
        >
          <p className="max-w-xl text-lg leading-relaxed text-ink-subtle">
            Hireflow reads your resume, GitHub, and code — then runs a real
            voice interview and scores it instantly. Practice like it's the
            real thing.
          </p>
         
        </div>

        <div
          className="ln-rise mt-8 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "180ms" }}
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

        <div
          className="ln-rise mt-14 sm:mt-16 lg:mt-20"
          style={{ animationDelay: "300ms" }}
        >
          <InterviewStage />
        </div>
      </div>
    </section>
  );
}
