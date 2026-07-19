import type { Route } from "./+types/jobs";
import { Jobs } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Jobs — Hireflow" }];
}

export default function DashboardJobsRoute() {
  return <Jobs />;
}
