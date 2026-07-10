import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/start";
import TopNav from "~/components/app/TopNav";
import PreInterview from "~/components/pre-interview/PreInterview";
import { useAuth } from "~/store/store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New interview — Sable" }];
}

export default function Start() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  // Guard direct/link entry to /start: an unauthenticated visitor gets the
  // sign-up modal and is sent back to the dashboard if they dismiss it.
  useEffect(() => {
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
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="py-12 sm:py-16">
        <PreInterview />
      </main>
    </div>
  );
}
