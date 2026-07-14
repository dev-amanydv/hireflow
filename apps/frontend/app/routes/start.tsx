import { useEffect } from "react";
import { useLoaderData, useNavigate, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/start";
import type { loader as rootLoader } from "~/root";
import TopNav from "~/components/app/TopNav";
import PreInterview from "~/components/pre-interview/PreInterview";
import { ThemeProvider, getThemeFromCookie } from "~/lib/theme";
import { useAuth } from "~/store/store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New interview — QuickHire" }];
}

export function loader({ request }: Route.LoaderArgs) {
  return { theme: getThemeFromCookie(request.headers.get("cookie")) };
}

export default function Start() {
  const { theme } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const user = useRouteLoaderData<typeof rootLoader>("root")?.user ?? null;

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
    <ThemeProvider
      initialTheme={theme}
      className="min-h-screen bg-background text-foreground"
    >
      <TopNav />
      <main className="py-12 sm:py-16">
        <PreInterview />
      </main>
    </ThemeProvider>
  );
}
