import { redirect } from "react-router";
import type { Route } from "./+types/result";

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
