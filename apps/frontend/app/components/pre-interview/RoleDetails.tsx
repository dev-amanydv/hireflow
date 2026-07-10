import { useState } from "react";
import { ArrowRight, Check, Code2, Network, Shuffle, Users } from "lucide-react";
import z from "zod";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";

interface RoleDetails {
  jobRole: string;
  type: "mixed" | "behavioural" | "technical" | "systemDesign";
  experience: "beginner" | "junior" | "mid" | "senior" | "staff";
}

const roleDetailsSchema = z.object({
  jobRole: z.string().min(1),
  type: z.literal(["mixed", "behavioural", "technical", "systemDesign"]),
  experience: z.literal(["beginner", "junior", "mid", "senior", "staff"]),
});

const ROLES = [
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "AI Engineer",
  "ML Engineer",
  "DevOps Engineer",
  "Mobile Engineer",
  "Product Manager",
] as const;

const LEVELS = [
  { value: "beginner", label: "Beginner", note: "0 yrs" },
  { value: "junior", label: "Junior", note: "0–2 yrs" },
  { value: "mid", label: "Mid", note: "2–5 yrs" },
  { value: "senior", label: "Senior", note: "5–9 yrs" },
  { value: "staff", label: "Staff", note: "10+ yrs" },
] as const;

const TYPES = [
  { value: "mixed", label: "Mixed", note: "Behavioural + technical + design", icon: Shuffle },
  { value: "behavioural", label: "Behavioural", note: "Past work, collaboration, judgment", icon: Users },
  { value: "technical", label: "Technical", note: "Coding, fundamentals, problem-solving", icon: Code2 },
  { value: "systemDesign", label: "System Design", note: "Architecture, scale, tradeoffs", icon: Network },
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold tracking-tight text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RoleDetails({
  setRoleDetails,
  setStep,
}: {
  setRoleDetails: (value: RoleDetails) => void,
  setStep: (value: number) => void,
}) {
  const [data, setData] = useState<RoleDetails>({
    jobRole: ROLES[0],
    type: "mixed",
    experience: "mid",
  });

  
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const { success, data: parsed } = roleDetailsSchema.safeParse(data);
    if (!success) {
      toast.error("Select a valid role");
      return;
    }
    setRoleDetails(parsed);
    setStep(2);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-8">
        <span className=" text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Step 01 — Role
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
          Who are we interviewing for?
        </h1>
      </div>

      <div className="space-y-7">
        <Field label="Role">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => {
              const on = data.jobRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setData((d) => ({...data, jobRole: r}))}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted/40 text-foreground hover:border-foreground/30 hover:bg-muted"
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Experience level">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {LEVELS.map((l) => {
              const on = data.experience === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setData((d) => ({ ...data, experience: l.value}))}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl box-border border px-4 py-2.5 text-left transition-all",
                    on
                      ? "border-foreground bg-card border"
                      : "border-border/30 border bg-muted/40 hover:border-foreground/30"
                  )}
                >
                  <span className="text-[15px] font-semibold tracking-tight">{l.label}</span>
                  <span className="text-xs text-muted-foreground">{l.note}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Interview focus">
          <div className="flex flex-col gap-2">
            {TYPES.map((t) => {
              const on = data.type === t.value;
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setData((d) => ({ ...data, type: t.value}))}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                    on
                      ? "border-foreground bg-card shadow-[0_1px_0_var(--foreground),0_8px_24px_-16px_rgba(0,0,0,0.4)]"
                      : "border-border bg-muted/40 hover:border-foreground/30"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-semibold tracking-tight">{t.label}</span>
                      <span className="text-[13px] text-muted-foreground">{t.note}</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5.5 shrink-0 items-center justify-center rounded-full transition-colors",
                      on ? "bg-primary text-primary-foreground" : "bg-transparent"
                    )}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="mt-8 flex justify-end border-t pt-6">
        <Button type="submit" size="lg" className="gap-2 px-6">
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
