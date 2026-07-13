import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ln-lift flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card px-6 py-20 text-center",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
        <Icon className="size-6 text-ink-subtle" />
      </div>
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-subtle">{description}</p>
      </div>
      {action}
    </div>
  );
}
