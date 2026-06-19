import { createAdminClient } from "./supabase/admin";

/**
 * Record a sensitive action to the append-only crm_audit_log (customer-data
 * project). Never throws — auditing must not break the page it's logging.
 */
export async function logAudit(entry: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createAdminClient().from("crm_audit_log").insert({
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      detail: entry.detail ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write", entry.action, err);
  }
}
