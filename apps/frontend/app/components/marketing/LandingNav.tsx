import { useNavigate } from "react-router";
import { Brand } from "~/components/app/Brand";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
  { label: "FAQ", href: "#faq" },
];

const NAV_HEIGHT = 56;
const BLUR_HEIGHT = 168;

const BLUR_LAYERS = [
  { blur: 0.5, solidTo: NAV_HEIGHT, fadeTo: 168 },
  { blur: 1, solidTo: NAV_HEIGHT, fadeTo: 152 },
  { blur: 2, solidTo: NAV_HEIGHT + 4, fadeTo: 132 },
  { blur: 4, solidTo: NAV_HEIGHT + 8, fadeTo: 110 },
  { blur: 8, solidTo: NAV_HEIGHT + 12, fadeTo: 90 },
];

export default function LandingNav() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: BLUR_HEIGHT }}
      >
        {BLUR_LAYERS.map((layer) => {
          const mask = `linear-gradient(to bottom, black ${layer.solidTo}px, transparent ${layer.fadeTo}px)`;
          return (
            <div
              key={layer.blur}
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${layer.blur}px)`,
                WebkitBackdropFilter: `blur(${layer.blur}px)`,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            />
          );
        })}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, color-mix(in oklab, var(--background) 60%, transparent) ${NAV_HEIGHT}px, transparent ${BLUR_HEIGHT}px)`,
          }}
        />
      </div>

      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Brand to="/" />

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-subtle transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate("/dashboard/overview")}
            className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            Continue
          </button>
        </div>
      </div>
    </header>
  );
}
