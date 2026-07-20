import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/start";
import TopNav from "~/components/app/TopNav";
import PreInterview from "~/components/pre-interview/PreInterview";
import { useAuth } from "~/store/store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New interview — Hireflow" }];
}

export default function Start() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s._hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (user) return;

    const { openAuthModal } = useAuth.getState();
    let settled = false;
    const finish = (authed: boolean) => {
      if (settled) return;
      settled = true;
      unsub();
      if (!authed) navigate("/dashboard");
    };
    openAuthModal({ mode: "signup", onSuccess: () => finish(true) });
    const unsub = useAuth.subscribe((s) => {
      if (!s.authModal.open) queueMicrotask(() => finish(false));
    });

    return () => unsub();
  }, [user, hydrated, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="py-12 sm:py-16">
        <PreInterview />
      </main>
    </div>
  );
}
