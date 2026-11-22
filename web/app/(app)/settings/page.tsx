import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getServerSessionUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <SettingsClient user={user} />;
}
