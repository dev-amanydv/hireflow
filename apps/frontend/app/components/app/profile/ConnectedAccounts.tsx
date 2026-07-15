import { toast } from "sonner";

const ACCOUNTS = [
  {
    id: "github",
    label: "GitHub",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.48 2 2 6.58 2 12.19c0 4.49 2.87 8.3 6.84 9.65.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.19-3.37-1.19-.45-1.17-1.11-1.48-1.11-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.19C22 6.58 17.52 2 12 2Z"
        />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 9.5H5.67V18h2.67V9.5ZM7 5.7a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1ZM18.34 18v-4.66c0-2.5-1.33-3.66-3.11-3.66-1.43 0-2.07.79-2.43 1.34V9.5H10.1c.04.75 0 8.5 0 8.5h2.7v-4.75c0-.25.02-.5.09-.68.2-.5.66-1.03 1.43-1.03 1 0 1.4.77 1.4 1.9V18h2.62Z" />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google",
    icon: (props: React.ComponentProps<"svg">) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
] as const;

function handleConnect(label: string) {
  toast.success(`${label} connections are coming soon`, {
    description: "We're still polishing this integration.",
  });
}

export function ConnectedAccounts() {
  return (
    <div className="ln-lift ln-rise rounded-2xl border border-border bg-card p-5">
      <span className="ln-eyebrow">Connected accounts</span>
      <h3 className="mt-1 text-sm font-semibold text-foreground">
        Link your professional identity
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ACCOUNTS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleConnect(label)}
            className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="block text-[11px] text-ink-tertiary">Not connected</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConnectedAccountsSkeleton() {
  return (
    <div className="ln-lift rounded-2xl border border-border bg-card p-5">
      <div className="skeleton-shimmer h-4 w-32 rounded bg-muted" />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
