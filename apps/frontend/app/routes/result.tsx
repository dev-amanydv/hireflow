import { redirect } from "react-router";
import type { Route } from "./+types/result";

// The interview report moved into the dashboard shell at
// /dashboard/interviews/:interviewId/result. Keep this old query-param URL working
// (bookmarks, in-flight interview redirects) by forwarding to the new path.
export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const interviewId = url.searchParams.get("interviewId");
  if (interviewId) {
    return redirect(`/dashboard/interviews/${interviewId}/result`);
  }
  return redirect("/dashboard/interviews");
}

export default function Result() {
  return null;
}
