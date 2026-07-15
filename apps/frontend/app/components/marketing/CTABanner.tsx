import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <div className="ln-lift relative overflow-hidden rounded-2xl border border-hairline-strong bg-card px-8 py-16 text-center sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(50% 120% at 50% 0%, rgba(94,106,210,0.14), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-6">
          <h2 className="ln-display-md max-w-xl text-foreground">
            Ready to run your first interview?
          </h2>
          <p className="max-w-md text-base text-ink-subtle">
            Bring your resume and GitHub. QuickHire handles the rest — no
            scheduling, no waiting.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/overview")}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            Start practicing free
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
