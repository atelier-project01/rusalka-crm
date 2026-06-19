import { createClient } from "@supabase/supabase-js";

/**
 * Server-only service-role client for the CUSTOMER DATA project (ecommerce).
 * Bypasses RLS. The CRM is staff-gated at the (app) layout, so reading across
 * all customers happens here server-side. Distinct from staff auth, which lives
 * in the internal (RusalkaOps) project. NEVER import this into a client component.
 */
export function createAdminClient() {
  return createClient(
    process.env.DATA_SUPABASE_URL!,
    process.env.DATA_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
