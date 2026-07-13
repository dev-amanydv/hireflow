import { Link } from "react-router";
import { cn } from "~/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="22" height="22" rx="6" fill="currentColor" />
      <path
        d="M6.5 15.5 15.5 6.5M9 17.5 17.5 9"
        stroke="var(--background)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      className={cn(
        "inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-90",
        className
      )}
    >
      <BrandMark className="size-[22px] text-foreground" />
      <span className="text-[17px] font-semibold tracking-tight">QuickHire</span>
    </Link>
  );
}
