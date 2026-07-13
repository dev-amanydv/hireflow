import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard";
import DashboardSidebar from "~/components/app/DashboardSidebar";
import { Brand } from "~/components/app/Brand";
import { ThemeProvider, getThemeFromCookie } from "~/lib/theme";
import { ThemeToggle } from "~/components/app/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard — QuickHire" }];
}

export function loader({ request }: Route.LoaderArgs) {
  return { theme: getThemeFromCookie(request.headers.get("cookie")) };
}

export default function Dashboard() {
  const { theme } = useLoaderData<typeof loader>();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider
      initialTheme={theme}
      className="flex min-h-screen bg-background text-foreground"
    >
      <DashboardSidebar className="sticky top-0 hidden h-screen lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Brand to="/" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="rounded-md border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-muted"
                >
                  <Menu className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 sm:max-w-64">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <DashboardSidebar
                  onNavigate={() => setMobileOpen(false)}
                  className="h-full w-full border-r-0"
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
