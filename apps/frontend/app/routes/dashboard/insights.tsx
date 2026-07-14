import type { Route } from "./+types/insights";
import { Insights } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Insights — QuickHire" }];
}

export default function DashboardInsightsRoute() {
  return <Insights />;
}
