import { Menu, Settings, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Brand } from "./Brand";
import DashboardSidebar from "./DashboardSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useAuth, usePageEyebrow } from "~/store/store";

export default function DashboardTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const eyebrow = usePageEyebrow((s) => s.eyebrow);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/60 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
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
          <SheetContent
            side="left"
            className="w-[264px] border-sidebar-border bg-sidebar p-0 sm:max-w-[264px]"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DashboardSidebar
              onNavigate={() => setMobileOpen(false)}
              className="h-full w-full border-r-0"
            />
          </SheetContent>
        </Sheet>
        <Brand to="/" />
      </div>

      {eyebrow && (
        <span className="ln-eyebrow hidden md:block">{eyebrow}</span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Avatar>
                  <AvatarFallback className="text-xs font-semibold">
                    {user.email.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5 normal-case">
                <span className="truncate text-sm font-medium text-foreground">
                  {user.email.split("@")[0]}
                </span>
                <span className="truncate text-xs font-normal text-ink-tertiary">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!user && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAuthModal({ mode: "signin" })}
            >
              Log in
            </Button>
            <Button size="sm" onClick={() => openAuthModal({ mode: "signup" })}>
              Sign up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
