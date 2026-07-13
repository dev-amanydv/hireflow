import { Link } from "react-router";
import { ArrowLeft, BarChart3 } from "lucide-react";
import type { Route } from "./+types/result";
import TopNav from "~/components/app/TopNav";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Result — QuickHire" }];
}

export default function Result() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
          <BarChart3 className="size-6 text-ink-subtle" />
        </div>
        <span className="ln-eyebrow mt-6">Report</span>
        <h1 className="ln-display-md mt-3 text-foreground">
          Your scorecard is on its way
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
          Once you finish an interview, your objective scorecard and breakdown
          will appear here.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}
