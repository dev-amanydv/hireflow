import type { Route } from "./+types/practice";
import { Practice } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Practice — QuickHire" }];
}

export default function DashboardPracticeRoute() {
  return <Practice />;
}
