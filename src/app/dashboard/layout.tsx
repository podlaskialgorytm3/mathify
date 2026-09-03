import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/app-shell";
import { auth, signOut } from "@/lib/auth";
import { DASHBOARD_NAVIGATION, ROLE_LABELS } from "@/lib/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      navigation={DASHBOARD_NAVIGATION[user.role] ?? []}
      userName={user.name ?? ""}
      roleLabel={ROLE_LABELS[user.role] ?? ""}
      showLatexMenu={user.role === "TEACHER"}
      signOutAction={handleSignOut}
    >
      {children}
    </AppShell>
  );
}
