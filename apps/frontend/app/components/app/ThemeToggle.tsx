import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useThemeOptional } from "~/lib/theme";
import { cn } from "~/lib/utils";

/**
 * Sun/moon theme switch. Both icons are stacked and crossfaded so the swap
 * reads as one control changing state rather than two buttons. Respects
 * `prefers-reduced-motion` (the transition collapses to an instant swap).
 *
 * Renders nothing outside a ThemeProvider (e.g. on the dark-locked result
 * page, where TopNav is shown but there is no active theme to toggle).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const ctx = useThemeOptional();
  if (!ctx) return null;
  const { theme, toggle } = ctx;
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("relative text-ink-subtle hover:text-foreground", className)}
    >
      <Sun
        className={cn(
          "size-4 transition-all duration-200 motion-reduce:transition-none",
          isDark
            ? "scale-75 -rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-200 motion-reduce:transition-none",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-75 rotate-90 opacity-0"
        )}
      />
    </Button>
  );
}
