import type { Route } from "./+types/resume-detail";
import ResumeReport from "~/components/app/resume-analyzer/ResumeReport";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Resume report — QuickHire" }];
}

export default function DashboardResumeDetailRoute({ params }: Route.ComponentProps) {
  return <ResumeReport id={params.id} />;
}
