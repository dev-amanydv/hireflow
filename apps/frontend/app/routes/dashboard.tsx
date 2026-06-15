import { useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireAuth, userContext } from "~/lib/auth.server";

export const middleware: Route.MiddlewareFunction[] = [requireAuth];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return { user };
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="container h-screen mx-auto flex justify-center items-center">
      Dashboard — {user?.email}
    </div>
  );
}
