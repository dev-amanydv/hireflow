import type { Route } from "./+types/resume";
import { Resume } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Analyze resume — QuickHire" }];
}

export default function DashboardResumeRoute() {
  return <Resume />;
}
