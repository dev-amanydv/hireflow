import type { Route } from "./+types/overview";
import { Overview } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Overview — Hireflow" }];
}

export default function DashboardOverviewRoute() {
  return <Overview />;
}
