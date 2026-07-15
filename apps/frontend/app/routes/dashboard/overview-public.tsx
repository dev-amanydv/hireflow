import type { Route } from "./+types/overview-public";
import { PublicInterviewsFeedPage } from "~/components/app/PublicInterviewsFeedPage";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Public interviews — QuickHire" }];
}

export default function DashboardOverviewPublicRoute() {
  return <PublicInterviewsFeedPage />;
}
