import type { Route } from "./+types/profile-public";
import TopNav from "~/components/app/TopNav";
import { PublicProfilePage } from "~/components/app/profile/PublicProfilePage";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.username} — Hireflow` }];
}

export default function ProfilePublicRoute({ params }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="py-10 sm:py-14">
        <PublicProfilePage username={params.username!} />
      </main>
    </div>
  );
}
