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

/** Log a new care item against a customer. */
export async function createCareItem(formData: FormData) {
  const customerId = String(formData.get("customerId") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim() || null;
  if (!customerId || !subject) return;

  const user = await staffUser();
  if (!user) return;

  await createAdminClient().from("care_items").insert({ customer_id: customerId, subject, body });
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "create_care_item",
    entityType: "customer",
    entityId: customerId,
    detail: { subject },
  });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/care");
}

/** Triage: assign-to-me, change status, and/or record a resolution. */
export async function updateCare(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const user = await staffUser();
  if (!user) return;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const status = formData.get("status");
  if (typeof status === "string" && status) patch.status = status;
  if (String(formData.get("assignToMe")) === "true") patch.assignee = user.email;
  const resolution = formData.get("resolution");
  if (typeof resolution === "string" && resolution.trim()) patch.resolution = resolution.trim();

  const db = createAdminClient();
  const { data } = await db.from("care_items").update(patch).eq("id", id).select("customer_id").maybeSingle();

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update_care_item",
    entityType: "care_item",
    entityId: id,
    detail: patch,
  });
  revalidatePath("/care");
  if (data?.customer_id) revalidatePath(`/customers/${data.customer_id}`);
}
