import { ArrowRight } from "lucide-react";

export default function ProductSection({
  label,
  title,
  description,
  children,
  align = "left",
}: {
  label: string;
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
        <h2 className="ln-display-lg max-w-md text-foreground">{title}</h2>
        <div className="flex max-w-md flex-col gap-6 md:pt-2">
          <p className="text-lg leading-relaxed text-ink-muted">{description}</p>
          <div className="flex items-center gap-2 text-sm text-ink-subtle">
            <span className="ln-mono text-ink-tertiary">{label}</span>
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>

      <div className={`mt-14 ${align === "right" ? "md:pl-24" : "md:pr-24"}`}>
        {children}
      </div>
    </section>
  );
}
