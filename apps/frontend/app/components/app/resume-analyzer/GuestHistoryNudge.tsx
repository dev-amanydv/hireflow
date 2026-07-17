import { ArrowRight, History, LineChart, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/store/store";

const PERKS = [
  { icon: History, text: "Every report saved to your history" },
  { icon: LineChart, text: "Track your score as you rewrite" },
  { icon: Sparkles, text: "Practice interviews built on your resume" },
];

export default function GuestHistoryNudge() {
  const openAuthModal = useAuth((s) => s.openAuthModal);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="ln-eyebrow">Save your work</h2>
      <div className="ln-lift ln-rise relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 24%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">
              Keep your reports in one place
            </h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-subtle">
              You can analyze without an account — but your reports won't be waiting for you when
              you come back. Create one and they will be.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {PERKS.map((perk) => (
                <span key={perk.text} className="flex items-center gap-2 text-xs text-ink-subtle">
                  <perk.icon className="size-3.5 shrink-0 text-primary" />
                  {perk.text}
                </span>
              ))}
            </div>
          </div>
          <Button
            size="lg"
            className="shrink-0 gap-2"
            onClick={() => openAuthModal({ mode: "signup" })}
          >
            Create free account
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
