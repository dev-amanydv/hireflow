import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "react-router";
import axios from "axios";
import type { Route } from "./+types/root";
import "./app.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import AuthModals from "./components/auth/AuthModals";
import "./lib/api";
import { getUser } from "./lib/auth.server";
import { ThemeProvider, getThemeFromCookie } from "./lib/theme";
import { BACKEND_URL } from "./lib/config";
import { useAuth } from "./store/store";

export function loader({ request }: Route.LoaderArgs) {
  return {
    user: getUser(request),
    theme: getThemeFromCookie(request.headers.get("cookie")),
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/hireflow-icon.png", type: "image/png", sizes: "256x256" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

export const meta: Route.MetaFunction = () => [
  { title: "Hireflow — The AI interviewer, built for the AI era" },
  {
    name: "description",
    content:
      "Practice interviews that feel real. Hireflow reads your resume, GitHub, and code to run adaptive engineering interviews and score them instantly.",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useRouteLoaderData<typeof loader>("root")?.theme ?? "light";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <TooltipProvider>
            <ThemeProvider initialTheme={theme}>
              <Toaster position="top-center" />
              {children}
              <AuthModals />
            </ThemeProvider>
          </TooltipProvider>
        </GoogleOAuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const addUser = useAuth((s) => s.addUser);
  const removeUser = useAuth((s) => s.removeUser);
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    if (user) {
      addUser(user);
      hydrate();
    } else {
      axios
        .get(`${BACKEND_URL}/auth/me`, { withCredentials: true })
        .then((res) => {
          if (res.data?.success) addUser(res.data.data);
        })
        .catch(() => removeUser())
        .finally(() => hydrate());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
