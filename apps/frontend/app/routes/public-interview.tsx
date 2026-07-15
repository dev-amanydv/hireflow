import { useLoaderData } from "react-router";
import type { Route } from "./+types/public-interview";
import TopNav from "~/components/app/TopNav";
import { PublicInterviewPage } from "~/components/app/profile/PublicInterviewPage";
import { ThemeProvider, getThemeFromCookie } from "~/lib/theme";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.username}'s interview — QuickHire` }];
}

export function loader({ request }: Route.LoaderArgs) {
  return { theme: getThemeFromCookie(request.headers.get("cookie")) };
}

export default function PublicInterviewRoute({ params }: Route.ComponentProps) {
  const { theme } = useLoaderData<typeof loader>();

  return (
    <ThemeProvider
      initialTheme={theme}
      className="min-h-screen bg-background text-foreground"
    >
      <TopNav />
      <main className="py-10 sm:py-14">
        <PublicInterviewPage username={params.username!} interviewId={params.interviewId!} />
      </main>
    </ThemeProvider>
  );
}
