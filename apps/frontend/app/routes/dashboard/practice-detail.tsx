import type { Route } from "./+types/practice-detail";
import { PracticeSkillDetail } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Practice — Hireflow" }];
}

export default function DashboardPracticeDetailRoute() {
  return <PracticeSkillDetail />;
}
