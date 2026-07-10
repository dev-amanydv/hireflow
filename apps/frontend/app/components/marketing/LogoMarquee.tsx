const COMPANIES = [
  "Vercel",
  "OpenAI",
  "Stripe",
  "Ramp",
  "Linear",
  "Coinbase",
  "Notion",
  "Anthropic",
];

export default function LogoMarquee() {
  const row = [...COMPANIES, ...COMPANIES];
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="mb-8 text-center text-sm text-ink-tertiary">
        Practice for roles at companies like
      </p>
      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="ln-marquee flex w-max items-center gap-14">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-lg font-semibold tracking-tight text-ink-subtle/70"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
