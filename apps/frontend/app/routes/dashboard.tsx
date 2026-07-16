import { Outlet } from "react-router";
import type { Route } from "./+types/dashboard";
import DashboardSidebar from "~/components/app/DashboardSidebar";
import DashboardTopbar from "~/components/app/DashboardTopbar";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard — QuickHire" }];
}

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar className="sticky top-0 hidden h-screen lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar />

        <main className="flex-1 px-5 py-3 sm:px-8 lg:px-12 lg:py-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
