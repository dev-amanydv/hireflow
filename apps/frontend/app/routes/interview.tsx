import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import type { Route } from "./+types/interview";
import { Suspense, lazy, useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Interview — QuickHire" }];
}

const InterviewRoom = lazy(() => import("~/components/app/InterviewRoom"));

function Preparing() {
  return (
    <div className="dark flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <Loader2 className="size-5 animate-spin text-ink-subtle" />
      <p className="text-sm text-ink-subtle">Preparing your room…</p>
    </div>
  );
}

export default function Interview() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Theme is normally scoped to a `.dark` wrapper div (see app/lib/theme.tsx), not
  // `<html>`, so Radix portals (dialogs, dropdowns) render to document.body outside
  // that scope and pick up light-theme tokens. This route is permanently dark-locked,
  // so mirror the class onto <html> for the lifetime of the page — fixes portalled
  // content (e.g. the end-call confirmation dialog) without affecting other routes.
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  if (!mounted || !id) return <Preparing />;

  return (
    <div className="dark h-dvh w-full overflow-hidden bg-background text-foreground">
      <Suspense fallback={<Preparing />}>
        <InterviewRoom interviewId={id} />
      </Suspense>
    </div>
  );
}
