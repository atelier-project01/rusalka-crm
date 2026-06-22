import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser, allowedModules } from "@/lib/roles";
import Shell from "./shell";

/**
 * Authenticated app shell. Every module route lives under this group, so the
 * staff session is checked once here. Unauthenticated visitors are redirected
 * to the login page before any module renders. The staff role (from the
 * RusalkaOps identity) decides which modules appear; route-level access is
 * enforced in middleware.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = roleFromUser(user);

  return (
    <Shell userEmail={user.email ?? "Staff"} role={role} allowed={allowedModules(role)}>
      {children}
    </Shell>
  );
}
