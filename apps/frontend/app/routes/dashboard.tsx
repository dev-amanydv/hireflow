import { Menu } from "lucide-react";
import { useState } from "react";
import type { Route } from "./+types/dashboard";
import DashboardSidebar, {
  type DashboardSection,
} from "~/components/app/DashboardSidebar";
import DashboardSections from "~/components/app/DashboardSections";
import { Brand } from "~/components/app/Brand";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard — Sable" }];
}

export default function Dashboard() {
  const [section, setSection] = useState<DashboardSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const select = (id: DashboardSection) => {
    setSection(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <DashboardSidebar
        active={section}
        onSelect={select}
        className="sticky top-0 hidden h-screen lg:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Brand to="/" />
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
                active={section}
                onSelect={select}
                className="h-full w-full border-r-0"
              />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="mx-auto max-w-5xl">
            <DashboardSections section={section} />
          </div>
        </main>
      </div>
    </div>
  );
}
