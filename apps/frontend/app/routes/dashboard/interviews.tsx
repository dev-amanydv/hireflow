import type { Route } from "./+types/interviews";
import { Interviews } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Past interviews — Hireflow" }];
}

export default function DashboardInterviewsRoute() {
  return <Interviews />;
}
