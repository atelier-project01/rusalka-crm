"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser } from "@/lib/roles";

// One filter row. Combined with AND. `field` selects the column/behaviour,
// `value` is the comparison value (string or number depending on the field).
export type Rule = { field: string; value: string | number };

const PROFILE = "customer_seg_profile";

// Minimal structural view of the Supabase filter builder methods we chain.
// The real builder mutates and returns itself, so applying filters via this
// interface mutates the original query in place. Avoids `any`.
interface FilterChain {
  ilike(c: string, v: string): FilterChain;
  eq(c: string, v: unknown): FilterChain;
  contains(c: string, v: unknown): FilterChain;
  lt(c: string, v: string): FilterChain;
  gte(c: string, v: number): FilterChain;
}

function applyRules(query: FilterChain, rules: Rule[]): FilterChain {
  for (const r of rules) {
    const v = r.value;
    if (v === "" || v === null || v === undefined) continue;
    switch (r.field) {
      case "skin_type": query = query.ilike("skin_type", `%${v}%`); break;
      case "concern": query = query.contains("concerns", [v]); break;
      case "customer_type": query = query.eq("is_subscriber", v === "subscriber"); break;
      case "lifecycle_stage": query = query.eq("lifecycle_stage", v); break;
      case "tag": query = query.contains("tags", [v]); break;
      case "country": query = query.eq("last_country", v); break;
      case "last_order_before_days": {
        const cutoff = new Date(Date.now() - Number(v) * 86400000).toISOString();
        query = query.lt("last_order_at", cutoff);
        break;
      }
      case "total_spent_min": query = query.gte("total_spent", Number(v)); break;
      case "order_count_min": query = query.gte("order_count", Number(v)); break;
    }
  }
  return query;
}

export type Member = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  lifecycle_stage: string | null;
  skin_type: string | null;
  is_subscriber: boolean;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  last_country: string | null;
};

// Live "N customers match" count for the current filters.
export async function previewCount(rules: Rule[]): Promise<{ count: number; error?: string }> {
  const db = createAdminClient();
  const q = db.from(PROFILE).select("user_id", { count: "exact", head: true });
  applyRules(q as unknown as FilterChain, rules);
  const { count, error } = await q;
  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0 };
}

export async function listMembers(rules: Rule[], limit = 200): Promise<{ members: Member[]; error?: string }> {
  const db = createAdminClient();
  const q = db
    .from(PROFILE)
    .select("user_id, email, full_name, lifecycle_stage, skin_type, is_subscriber, order_count, total_spent, last_order_at, last_country")
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  applyRules(q as unknown as FilterChain, rules);
  const { data, error } = await q;
  if (error) return { members: [], error: error.message };
  return { members: (data ?? []) as Member[] };
}

// Distinct values to populate the builder's dropdowns.
export async function filterOptions(): Promise<{
  skinTypes: string[]; lifecycles: string[]; countries: string[]; concerns: string[]; tags: string[];
}> {
  const db = createAdminClient();
  const { data } = await db.from(PROFILE).select("skin_type, lifecycle_stage, last_country, concerns, tags").limit(5000);
  const rows = (data ?? []) as Array<{ skin_type: string | null; lifecycle_stage: string | null; last_country: string | null; concerns: string[] | null; tags: string[] | null }>;
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();
  return {
    skinTypes: uniq(rows.map((r) => r.skin_type)),
    lifecycles: uniq(rows.map((r) => r.lifecycle_stage)),
    countries: uniq(rows.map((r) => r.last_country)),
    concerns: uniq(rows.flatMap((r) => r.concerns ?? [])),
    tags: uniq(rows.flatMap((r) => r.tags ?? [])),
  };
}

async function requireStaff(): Promise<boolean> {
  const role = roleFromUser(await getCurrentUser());
  return role === "admin" || role === "operations";
}

export async function createSegment(input: { name: string; description?: string; rules: Rule[] }): Promise<{ id?: string; error?: string }> {
  if (!(await requireStaff())) return { error: "Only admin/operations can create groups." };
  const name = (input.name || "").trim();
  if (!name) return { error: "Group name is required." };
  const user = await getCurrentUser();
  const createdBy = (user as { email?: string } | null)?.email ?? null;
  const db = createAdminClient();
  const { data, error } = await db
    .from("segments")
    .insert({ name, description: input.description?.trim() || null, rules: input.rules ?? [], type: "living", created_by: createdBy })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { id: data.id as string };
}

export async function deleteSegment(id: string): Promise<{ ok?: boolean; error?: string }> {
  if (!(await requireStaff())) return { error: "Only admin/operations can delete groups." };
  const db = createAdminClient();
  const { error } = await db.from("segments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/groups");
  return { ok: true };
}
