import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Shell from "./shell";

/**
 * Authenticated app shell. Every module route lives under this group, so the
 * staff session is checked once here. Unauthenticated visitors are redirected
 * to the login page before any module renders.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <Shell userEmail={user.email ?? "Staff"}>{children}</Shell>;
}
