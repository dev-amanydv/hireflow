import type { Route } from "./+types/settings";
import { SettingsSection } from "~/components/app/DashboardSections";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Settings — QuickHire" }];
}

export default function DashboardSettingsRoute() {
  return <SettingsSection />;
}
