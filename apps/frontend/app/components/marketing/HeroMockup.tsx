import { BrandMark } from "~/components/app/Brand";

export default function HeroMockup() {
  return (
    <div className="ln-lift overflow-hidden rounded-xl border border-hairline-strong bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#3e3e44]" />
          <span className="size-2.5 rounded-full bg-[#3e3e44]" />
          <span className="size-2.5 rounded-full bg-[#3e3e44]" />
        </span>
        <div className="ml-3 flex items-center gap-2 text-[13px] text-ink-subtle">
          <BrandMark className="size-3.5 text-foreground" />
          <span>Live interview · Backend Engineer</span>
        </div>
        <span className="ln-mono ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-ink-muted">
          14:22
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[168px_1fr_200px]">
        <aside className="hidden flex-col gap-1 border-r border-border p-3 md:flex">
          {[
            ["Overview", true],
            ["Transcript", false],
            ["Signals", false],
            ["Resume", false],
          ].map(([label, active]) => (
            <div
              key={label as string}
              className={`rounded-md px-2.5 py-1.5 text-[13px] ${
                active ? "bg-muted text-foreground" : "text-ink-subtle"
              }`}
            >
              {label}
            </div>
          ))}
          <div className="mt-auto rounded-lg border border-border bg-secondary p-2.5">
            <div className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              Question
            </div>
            <div className="mt-1 text-[13px] font-medium text-foreground">
              03 / 08
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-4 p-4">
          <Bubble who="QuickHire" tint>
            Walk me through how you'd keep{" "}
            <code className="ln-mono rounded bg-muted px-1 py-0.5 text-[12px]">
              vehicle_state
            </code>{" "}
            fresh without blocking the initial render.
          </Bubble>
          <Bubble who="You">
            I'd render from the last cached snapshot first, then reconcile in
            the background and diff only what changed…
          </Bubble>
          <div className="flex items-center gap-2 text-[12px] text-ink-subtle">
            <span className="flex gap-1">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
            QuickHire is following up
          </div>
        </div>

        <aside className="hidden flex-col gap-3 border-l border-border p-4 md:flex">
          <div className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
            Live signal
          </div>
          {[
            ["Technical depth", 82, "#5e6ad2"],
            ["Communication", 74, "#7a7fad"],
            ["Problem solving", 88, "#5e6ad2"],
          ].map(([label, val, color]) => (
            <div key={label as string} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-muted">{label}</span>
                <span className="ln-mono text-foreground">{val}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${val}%`, background: color as string }}
                />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Bubble({
  who,
  tint,
  children,
}: {
  who: string;
  tint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
        {who}
      </span>
      <div
        className={`max-w-[92%] rounded-lg border px-3 py-2 text-[13.5px] leading-relaxed ${
          tint
            ? "border-primary/25 bg-primary/10 text-foreground"
            : "border-border bg-secondary text-ink-muted"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-ink-subtle"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
