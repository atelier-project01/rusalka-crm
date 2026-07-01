"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser } from "@/lib/roles";

// One filter row. Rows are combined with AND. `field` selects the
// column/behaviour. `value` is the comparison value: multiselect fields (skin
// type, concern, lifecycle, country, tag) hold a string[]; single-value fields
// (customer type, the numeric thresholds) hold a scalar. Older saved groups may
// still hold a scalar for a now-multiselect field — the query logic folds both.
export type Rule = { field: string; value: string | number | string[] };

const PROFILE = "customer_seg_profile";

// Minimal structural view of the Supabase filter builder methods we chain.
// The real builder mutates and returns itself, so applying filters via this
// interface mutates the original query in place. Avoids `any`.
interface FilterChain {
  eq(c: string, v: unknown): FilterChain;
  in(c: string, v: readonly unknown[]): FilterChain;
  overlaps(c: string, v: readonly unknown[]): FilterChain;
  or(f: string): FilterChain;
  lt(c: string, v: string): FilterChain;
  gte(c: string, v: number): FilterChain;
}

// Normalise a rule value to a clean list of strings. Multiselect fields already
// hold an array; scalar values (single-value fields, or older saved groups) fold
// to a one-element list so the query logic below stays uniform.
function toList(v: Rule["value"]): string[] {
  const arr = Array.isArray(v) ? v : v === "" || v === null || v === undefined ? [] : [v];
  return arr.map((x) => String(x)).filter((x) => x !== "");
}

function applyRules(query: FilterChain, rules: Rule[]): FilterChain {
  for (const r of rules) {
    const v = r.value;
    switch (r.field) {
      // Multiselect fields — several values in one row match ANY (OR); rows still AND.
      case "skin_type": {
        // skin_type data is inconsistent ("Oily" vs "Oily Skin") — match leniently.
        const vals = toList(v);
        if (vals.length) query = query.or(vals.map((x) => `skin_type.ilike.%${x}%`).join(","));
        break;
      }
      case "concern": { const vals = toList(v); if (vals.length) query = query.overlaps("concerns", vals); break; }
      case "lifecycle_stage": { const vals = toList(v); if (vals.length) query = query.in("lifecycle_stage", vals); break; }
      case "tag": { const vals = toList(v); if (vals.length) query = query.overlaps("tags", vals); break; }
      case "country": { const vals = toList(v); if (vals.length) query = query.in("last_country", vals); break; }
      // Quiz fields — single-answer questions map to a text column (match ANY via .in).
      case "age": { const vals = toList(v); if (vals.length) query = query.in("age", vals); break; }
      case "region": { const vals = toList(v); if (vals.length) query = query.in("region", vals); break; }
      case "environment": { const vals = toList(v); if (vals.length) query = query.in("environment", vals); break; }
      case "skin_tone": { const vals = toList(v); if (vals.length) query = query.in("skin_tone", vals); break; }
      case "routine_steps": { const vals = toList(v); if (vals.length) query = query.in("routine_steps", vals); break; }
      case "retinol_experience": { const vals = toList(v); if (vals.length) query = query.in("retinol_experience", vals); break; }
      case "fragrance_pref": { const vals = toList(v); if (vals.length) query = query.in("fragrance_pref", vals); break; }
      case "pregnancy": { const vals = toList(v); if (vals.length) query = query.in("pregnancy", vals); break; }
      // Quiz fields — multi-answer questions map to a text[] column (match ANY via .overlaps).
      case "skin_conditions": { const vals = toList(v); if (vals.length) query = query.overlaps("skin_conditions", vals); break; }
      case "ingredient_values": { const vals = toList(v); if (vals.length) query = query.overlaps("ingredient_values", vals); break; }
      case "avoid_ingredients": { const vals = toList(v); if (vals.length) query = query.overlaps("avoid_ingredients", vals); break; }
      // Single-value fields.
      case "customer_type": if (v === "subscriber" || v === "onetime") query = query.eq("is_subscriber", v === "subscriber"); break;
      case "last_order_before_days": {
        if (v === "" || v === null || v === undefined) break;
        const cutoff = new Date(Date.now() - Number(v) * 86400000).toISOString();
        query = query.lt("last_order_at", cutoff);
        break;
      }
      case "total_spent_min": if (v !== "" && v !== null && v !== undefined) query = query.gte("total_spent", Number(v)); break;
      case "order_count_min": if (v !== "" && v !== null && v !== undefined) query = query.gte("order_count", Number(v)); break;
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

// Values to populate the builder's dropdowns. Skin types / concerns / lifecycle
// stages / tags come from the admin-curated `segment_config` (Settings page);
// countries stay derived from the live order data (no curation needed there).
export async function filterOptions(): Promise<{
  skinTypes: string[]; lifecycles: string[]; countries: string[]; concerns: string[]; tags: string[];
}> {
  const db = createAdminClient();
  const { data: cfg } = await db.from("segment_config").select("key, values");
  const byKey: Record<string, string[]> = {};
  for (const r of (cfg ?? []) as Array<{ key: string; values: unknown }>) {
    byKey[r.key] = Array.isArray(r.values) ? (r.values as string[]) : [];
  }
  const { data } = await db.from(PROFILE).select("last_country").limit(5000);
  const countries = [...new Set(((data ?? []) as Array<{ last_country: string | null }>).map((r) => r.last_country).filter((x): x is string => !!x))].sort();
  return {
    skinTypes: byKey.skin_types ?? [],
    concerns: byKey.concerns ?? [],
    lifecycles: byKey.lifecycle_stages ?? [],
    tags: byKey.tags ?? [],
    countries,
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
