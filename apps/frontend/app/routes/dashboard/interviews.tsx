import type { Route } from "./+types/interviews";
import { Interviews } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Past interviews — QuickHire" }];
}

export default function DashboardInterviewsRoute() {
  return <Interviews />;
}
