import { Brand } from "~/components/app/Brand";

const COLUMNS: { title: string; links: string[] }[] = [
  {
    title: "Product",
    links: ["Overview", "How it works", "Pricing", "Changelog"],
  },
  { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
  {
    title: "Resources",
    links: ["Interview guide", "Sample reports", "Help center", "Status"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <Brand to="/" />
          <p className="max-w-[220px] text-[13px] leading-relaxed text-ink-tertiary">
            The AI interviewer that turns your real work into a tailored
            interview.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-foreground">
              {col.title}
            </span>
            {col.links.map((l) => (
              <a
                key={l}
                href="#features"
                className="text-[13px] text-ink-subtle transition-colors hover:text-foreground"
              >
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-[12px] text-ink-tertiary sm:flex-row sm:px-8">
          <span>
            © {new Date().getFullYear()} QuickHire Labs. All rights reserved.
          </span>
          <div className="flex items-center gap-5">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
