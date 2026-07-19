import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "~/lib/utils";

export type Theme = "light" | "dark";

export const THEME_COOKIE = "Hireflow-theme";

export function getThemeFromCookie(cookieHeader: string | null): Theme {
  const match = cookieHeader?.match(/(?:^|;\s*)Hireflow-theme=(light|dark)/);
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
      }
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      <div className={cn(theme === "dark" && "dark", className)}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
