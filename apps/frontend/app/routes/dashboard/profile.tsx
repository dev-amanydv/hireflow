import type { Route } from "./+types/profile";
import { ProfilePage } from "~/components/app/profile/ProfilePage";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Profile — QuickHire" }];
}

export default function DashboardProfileRoute() {
  return <ProfilePage />;
}
