"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

/**
 * Create a customer from the CRM. Customers are backed by an auth user (the id
 * is auth.users.id), so we provision one from the email — no password, same as
 * the storefront's no-signup flow — then set the editable fields. Idempotent by
 * email: an existing customer with that email is reused.
 */
export async function createCustomer(formData: FormData) {
  const user = await getCurrentUser();
  const role = roleFromUser(user);
  if (role !== "admin" && role !== "operations") return;

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email.includes("@")) return;
  const fullName = String(formData.get("full_name") || "").trim() || null;
  const lifecycle = String(formData.get("lifecycle_stage") || "lead");
  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const admin = createAdminClient();

  const findId = async () => {
    const { data } = await admin.from("customers").select("id").eq("email", email).limit(1);
    return (data?.[0]?.id as string | undefined) ?? null;
  };

  let id = await findId();
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    id = error ? await findId() : (data.user?.id ?? null);
  }
  if (!id) return;

  const patch: Record<string, unknown> = { full_name: fullName, tags, updated_at: new Date().toISOString() };
  if (["lead", "customer", "subscriber", "churned"].includes(lifecycle)) patch.lifecycle_stage = lifecycle;
  await admin.from("customers").update(patch).eq("id", id);

  await logAudit({ actorId: user?.id, actorEmail: user?.email, action: "create_customer", entityType: "customer", entityId: id, detail: { email } });
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

/**
 * Delete a customer and all their data. Admin only. quiz_results and
 * customer_orders have no FK to the customer, so they're removed explicitly;
 * deleting the auth user then cascades the customer, notes, consents and care.
 */
export async function deleteCustomer(formData: FormData) {
  const user = await getCurrentUser();
  if (roleFromUser(user) !== "admin") return;

  const id = String(formData.get("customerId") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("customer_orders").delete().eq("user_id", id);
  await admin.from("quiz_results").delete().eq("user_id", id);
  await admin.auth.admin.deleteUser(id); // cascades customers + interactions + consents + care

  await logAudit({ actorId: user?.id, actorEmail: user?.email, action: "delete_customer", entityType: "customer", entityId: id });
  revalidatePath("/customers");
  redirect("/customers");
}
