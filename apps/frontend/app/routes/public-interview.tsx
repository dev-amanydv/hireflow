import type { Route } from "./+types/public-interview";
import TopNav from "~/components/app/TopNav";
import { PublicInterviewPage } from "~/components/app/profile/PublicInterviewPage";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.username}'s interview — Hireflow` }];
}

export default function PublicInterviewRoute({ params }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="py-10 sm:py-14">
        <PublicInterviewPage username={params.username!} interviewId={params.interviewId!} />
      </main>
    </div>
  );
}
