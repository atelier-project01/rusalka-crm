import { createClient } from "@supabase/supabase-js";

/**
 * Server-only service-role client. Bypasses RLS. The CRM is staff-gated at the
 * (app) layout, so reading across all customers happens here server-side.
 * NEVER import this into a client component.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
