import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { Toaster } from "sonner"
import type { Route } from "./+types/root";
import "./app.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { TooltipProvider } from "./components/ui/tooltip";
import AuthModals from "./components/auth/AuthModals";
import { getUser } from "./lib/auth.server";
import { useAuth } from "./store/store";

export function loader({ request }: Route.LoaderArgs) {
  return { user: getUser(request) };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "Sable — The AI interviewer, built for the AI era" },
  {
    name: "description",
    content:
      "Practice interviews that feel real. Sable reads your resume, GitHub, and code to run adaptive engineering interviews and score them instantly.",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Toaster className="z-50" position="top-center" theme="dark" />
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <TooltipProvider>
            {children}
            <AuthModals />
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

  useEffect(() => {
    if (user) addUser(user);
    else removeUser();
  }, [user, addUser, removeUser]);

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
