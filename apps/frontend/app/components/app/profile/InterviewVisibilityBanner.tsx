import { useState } from "react";
import axios from "axios";
import { Globe, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

export function InterviewVisibilityBanner({
  interviewId,
  isPublic,
  onChange,
}: {
  interviewId: string;
  isPublic: boolean;
  onChange: (next: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !isPublic;
    setBusy(true);
    onChange(next);
    try {
      await axios.patch(
        `${BACKEND_URL}/interview/${interviewId}/visibility`,
        { isPublic: next },
        { withCredentials: true },
      );
      toast.success(next ? "Interview is now public" : "Interview is now private");
    } catch {
      onChange(!next);
      toast.error("Couldn't update visibility. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "ln-lift flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-5",
        isPublic
          ? "border-primary/60 bg-primary/10 ring-4 ring-primary/10"
          : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            isPublic ? "bg-primary/20 text-primary" : "bg-secondary text-ink-subtle",
          )}
        >
          {isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isPublic ? "This interview is public" : "This interview is private"}
          </p>
          <p className="mt-0.5 text-sm text-ink-subtle">
            {isPublic
              ? "Anyone with the link can watch this recording and it shows on your profile."
              : "Only you can see this page. It's hidden from your public profile."}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        aria-label={isPublic ? "Make this interview private" : "Make this interview public"}
        onClick={toggle}
        disabled={busy}
        className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin text-ink-subtle" />
        ) : (
          <span>{isPublic ? "Make private" : "Make public"}</span>
        )}
        <span
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            isPublic ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
              isPublic ? "translate-x-[18px]" : "translate-x-[3px]",
            )}
          />
        </span>
      </button>
    </div>
  );
}
