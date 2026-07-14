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

  if (!mounted || !id) return <Preparing />;

  return (
    <div className="dark h-dvh w-full overflow-hidden bg-background text-foreground">
      <Suspense fallback={<Preparing />}>
        <InterviewRoom interviewId={id} />
      </Suspense>
    </div>
  );
}
