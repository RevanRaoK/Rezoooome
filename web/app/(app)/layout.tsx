import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getServerSessionUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell user={{ id: user.id, name: user.name, email: user.email }}>
      {children}
    </AppShell>
  );
}
