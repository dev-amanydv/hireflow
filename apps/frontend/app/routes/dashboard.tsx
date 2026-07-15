import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard";
import DashboardSidebar from "~/components/app/DashboardSidebar";
import DashboardTopbar from "~/components/app/DashboardTopbar";
import { ThemeProvider, getThemeFromCookie } from "~/lib/theme";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard — QuickHire" }];
}

export function loader({ request }: Route.LoaderArgs) {
  return { theme: getThemeFromCookie(request.headers.get("cookie")) };
}

export default function Dashboard() {
  const { theme } = useLoaderData<typeof loader>();

  return (
    <ThemeProvider
      initialTheme={theme}
      className="flex min-h-screen bg-background text-foreground"
    >
      <DashboardSidebar className="sticky top-0 hidden h-screen lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar />

        <main className="flex-1 px-5 py-3 sm:px-8 lg:px-12 lg:py-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
