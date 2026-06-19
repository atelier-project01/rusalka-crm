import { createClient } from "@supabase/supabase-js";

/**
 * Server-only service-role client for the ERP project (recip3-prod), which owns
 * the GTIN pool / issuers / records. Read cross-project by the Barcode module.
 * The CRM is staff-gated at the (app) layout. NEVER import into a client component.
 */
export function createErpClient() {
  return createClient(
    process.env.ERP_SUPABASE_URL!,
    process.env.ERP_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
