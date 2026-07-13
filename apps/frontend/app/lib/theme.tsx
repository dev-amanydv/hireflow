import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "~/lib/utils";

/**
 * Scoped light/dark theme for the app surfaces (dashboard + pre-interview).
 *
 * We intentionally do NOT theme the whole document: the marketing landing page,
 * the result page, and the immersive interview room stay dark-locked. So the
 * theme is applied on a wrapper element via the `.dark` class rather than on
 * `<html>`. The initial value is read from a cookie in the route loader, which
 * keeps the server render and first client paint in sync (no theme flash).
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "sable-theme";

/** Parse the theme from a `Cookie` request header. Defaults to light. */
export function getThemeFromCookie(cookieHeader: string | null): Theme {
  const match = cookieHeader?.match(/(?:^|;\s*)sable-theme=(light|dark)/);
  return match?.[1] === "dark" ? "dark" : "light";
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/**
 * Like `useTheme`, but returns null instead of throwing when there is no
 * provider. Lets shared chrome (e.g. TopNav, used by both themed and
 * dark-locked routes) render a theme control only where a theme is active.
 */
export function useThemeOptional() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  initialTheme,
  className,
  children,
}: {
  initialTheme: Theme;
  className?: string;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      try {
        localStorage.setItem(THEME_COOKIE, next);
      } catch {
        // ignore storage failures (private mode, etc.)
      }
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      <div className={cn(theme === "dark" && "dark", className)}>{children}</div>
    </ThemeContext.Provider>
  );
}
