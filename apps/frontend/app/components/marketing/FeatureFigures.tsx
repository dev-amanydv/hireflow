function FigStack() {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      className="h-44 w-full text-hairline-strong"
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
        <path
          d="M120 34 210 76 120 118 30 76z"
          className="text-ink-tertiary"
          stroke="currentColor"
        />
        <path d="M120 58a26 13 0 1 0 .1 0z" opacity="0.7" />
        <path d="M97 70h46M104 76h32" opacity="0.5" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M120 ${96 + i * 16} 210 ${138 + i * 16} 120 ${180 + i * 16} 30 ${138 + i * 16}z`}
            opacity={0.9 - i * 0.15}
          />
        ))}
        <path
          d="M30 76v62M210 76v62M120 118v62"
          strokeDasharray="2 4"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

function FigCubes() {
  const cube = (x: number, y: number, s: number, o = 1) => {
    const h = s * 0.5;
    return (
      <g opacity={o}>
        <path
          d={`M${x} ${y} ${x + s} ${y + h} ${x} ${y + s} ${x - s} ${y + h}z`}
        />
        <path
          d={`M${x - s} ${y + h} ${x - s} ${y + h + s} ${x} ${y + s + s} ${x} ${y + s}z`}
        />
        <path
          d={`M${x + s} ${y + h} ${x + s} ${y + h + s} ${x} ${y + s + s} ${x} ${y + s}z`}
        />
      </g>
    );
  };
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      className="h-44 w-full text-hairline-strong"
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
        {cube(120, 24, 34, 0.95)}
        {cube(80, 74, 34, 0.8)}
        {cube(160, 74, 34, 0.8)}
        {cube(120, 104, 34, 0.65)}
      </g>
    </svg>
  );
}

function FigBars() {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      className="h-44 w-full text-hairline-strong"
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 40 + i * 18;
          const h = 30 + Math.abs(4 - i) * 12;
          const y = 150 - h;
          const d = 10;
          return (
            <g key={i} opacity={0.55 + i * 0.045}>
              <path
                d={`M${x} ${y} ${x + d} ${y} ${x + d} ${150} ${x} ${150}z`}
              />
              <path
                d={`M${x} ${y} ${x + d} ${y} ${x + d + 8} ${y - 5} ${x + 8} ${y - 5}z`}
              />
              <path
                d={`M${x + d} ${y} ${x + d + 8} ${y - 5} ${x + d + 8} ${145} ${x + d} ${150}z`}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const FIGURES = [
  {
    tag: "FIG 0.1",
    Art: FigStack,
    title: "Built from your work",
    body: "QuickHire reads your resume, GitHub repos, and links to ground every question in what you've actually shipped.",
  },
  {
    tag: "FIG 0.2",
    Art: FigCubes,
    title: "Powered by AI agents",
    body: "An adaptive interviewer that follows up, probes for depth, and adjusts to your level in real time.",
  },
  {
    tag: "FIG 0.3",
    Art: FigBars,
    title: "Scored instantly",
    body: "An objective scorecard with signal on your strengths and gaps the moment you finish.",
  },
];

export default function FeatureFigures() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <div className="grid grid-cols-1 gap-px overflow-hidden md:grid-cols-3">
        {FIGURES.map(({ tag, Art, title, body }, i) => (
          <div
            key={tag}
            className={`flex flex-col px-2 py-2 ${
              i !== 0 ? "md:border-l md:border-border md:pl-10" : ""
            } ${i !== FIGURES.length - 1 ? "md:pr-10" : ""}`}
          >
            <span className="ln-eyebrow">{tag}</span>
            <div className="my-8 flex flex-1 items-center justify-center">
              <Art />
            </div>
            <h3 className="text-[22px] font-medium tracking-tight text-foreground">
              {title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink-subtle">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
