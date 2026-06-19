"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

async function staffUser() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  return user;
}

/** Add an internal note to a customer's timeline. */
export async function addNote(formData: FormData) {
  const customerId = String(formData.get("customerId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!customerId || !body) return;

  const user = await staffUser();
  if (!user) return; // staff session required

  await createAdminClient()
    .from("customer_interactions")
    .insert({ customer_id: customerId, kind: "note", body, author: user.email ?? null });

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "add_note",
    entityType: "customer",
    entityId: customerId,
  });

  revalidatePath(`/customers/${customerId}`);
}

/** Record a marketing-consent change (append-only). */
export async function setConsent(formData: FormData) {
  const customerId = String(formData.get("customerId") || "");
  const channel = String(formData.get("channel") || "marketing_email");
  const optedIn = String(formData.get("optedIn")) === "true";
  if (!customerId) return;

  const user = await staffUser();
  if (!user) return;

  await createAdminClient()
    .from("consents")
    .insert({ customer_id: customerId, channel, opted_in: optedIn, source: "crm" });

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "set_consent",
    entityType: "customer",
    entityId: customerId,
    detail: { channel, optedIn },
  });

  revalidatePath(`/customers/${customerId}`);
}
