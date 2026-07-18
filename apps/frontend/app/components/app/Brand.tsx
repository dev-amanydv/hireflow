import { Link } from "react-router";
import { cn } from "~/lib/utils";

/** The "H" glyph on its own. One asset for both themes — the mark is blue either way. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/hireflow-mark.png"
      alt=""
      aria-hidden="true"
      className={cn("size-5 object-contain", className)}
    />
  );
}

/**
 * Full lockup (mark + wordmark). Two assets, swapped on theme: the light one has a
 * near-black wordmark, the dark one a white wordmark. Both are trimmed of the
 * tagline, which is unreadable at nav sizes.
 */
export function Brand({
  className,
  to = "/",
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      aria-label="Hireflow"
      className={cn(
        "inline-flex items-center text-foreground transition-opacity hover:opacity-90",
        className
      )}
    >
      <img
        src="/hireflow-lockup-light.png"
        alt="Hireflow"
        className="h-6 w-auto object-contain dark:hidden"
      />
      <img
        src="/hireflow-lockup-dark.png"
        alt="Hireflow"
        className="hidden h-6 w-auto object-contain dark:block"
      />
    </Link>
  );
}
