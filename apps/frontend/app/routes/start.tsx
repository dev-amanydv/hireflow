import type { Route } from "./+types/start";
import TopNav from "~/components/app/TopNav";
import PreInterview from "~/components/pre-interview/PreInterview";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New interview — Sable" }];
}

export default function Start() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="py-12 sm:py-16">
        <PreInterview />
      </main>
    </div>
  );
}
