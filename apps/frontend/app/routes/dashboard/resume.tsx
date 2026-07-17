import type { Route } from "./+types/resume";
import { Resume } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Analyze resume — Hireflow" }];
}

export default function DashboardResumeRoute() {
  return <Resume />;
}
