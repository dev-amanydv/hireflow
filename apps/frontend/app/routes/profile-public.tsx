import { useLoaderData } from "react-router";
import type { Route } from "./+types/profile-public";
import TopNav from "~/components/app/TopNav";
import { PublicProfilePage } from "~/components/app/profile/PublicProfilePage";
import { ThemeProvider, getThemeFromCookie } from "~/lib/theme";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.username} — QuickHire` }];
}

export function loader({ request }: Route.LoaderArgs) {
  return { theme: getThemeFromCookie(request.headers.get("cookie")) };
}

export default function ProfilePublicRoute({ params }: Route.ComponentProps) {
  const { theme } = useLoaderData<typeof loader>();

  return (
    <ThemeProvider
      initialTheme={theme}
      className="min-h-screen bg-background text-foreground"
    >
      <TopNav />
      <main className="py-10 sm:py-14">
        <PublicProfilePage username={params.username!} />
      </main>
    </ThemeProvider>
  );
}
