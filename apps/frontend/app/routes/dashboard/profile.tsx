import type { Route } from "./+types/profile";
import { Profile } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Profile — QuickHire" }];
}

export default function DashboardProfileRoute() {
  return <Profile />;
}
