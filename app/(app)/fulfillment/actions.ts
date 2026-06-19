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

/** Advance an order one step: Reserved -> Printed -> Fulfilled. */
export async function advanceOrder(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const user = await staffUser();
  if (!user) return;

  const db = createAdminClient();
  const { data: order } = await db
    .from("customer_orders")
    .select("printed_at, fulfilled_at, status")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.status === "cancelled" || order.fulfilled_at) return;

  const patch = !order.printed_at
    ? { printed_at: new Date().toISOString() }
    : { fulfilled_at: new Date().toISOString() };
  await db.from("customer_orders").update(patch).eq("id", id);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "advance_order",
    entityType: "order",
    entityId: id,
    detail: patch,
  });
  revalidatePath("/fulfillment");
  revalidatePath(`/fulfillment/${id}`);
}

/** Cancel an order. */
export async function cancelOrder(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const user = await staffUser();
  if (!user) return;

  await createAdminClient().from("customer_orders").update({ status: "cancelled" }).eq("id", id);
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "cancel_order",
    entityType: "order",
    entityId: id,
  });
  revalidatePath("/fulfillment");
  revalidatePath(`/fulfillment/${id}`);
}
