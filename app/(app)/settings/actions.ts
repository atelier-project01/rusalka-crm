"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser } from "@/lib/roles";
import { CONFIG_KEYS, type ConfigKey, type SegmentConfig } from "./config";

export async function getSegmentConfig(): Promise<SegmentConfig> {
  const db = createAdminClient();
  const { data } = await db.from("segment_config").select("key, values");
  const byKey: Record<string, string[]> = {};
  for (const r of (data ?? []) as Array<{ key: string; values: unknown }>) {
    byKey[r.key] = Array.isArray(r.values) ? (r.values as string[]) : [];
  }
  return {
    skin_types: byKey.skin_types ?? [],
    concerns: byKey.concerns ?? [],
    lifecycle_stages: byKey.lifecycle_stages ?? [],
    tags: byKey.tags ?? [],
  };
}

// Trim, drop blanks, dedupe case-insensitively (keeps the first casing), sort.
function clean(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = (raw ?? "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export async function saveSegmentConfig(key: ConfigKey, values: string[]): Promise<{ ok?: boolean; values?: string[]; error?: string }> {
  const user = await getCurrentUser();
  if (roleFromUser(user) !== "admin") return { error: "Only admins can edit segmentation settings." };
  if (!CONFIG_KEYS.includes(key)) return { error: "Unknown setting." };
  const cleaned = clean(values);
  const db = createAdminClient();
  const updatedBy = (user as { email?: string } | null)?.email ?? null;
  const { error } = await db
    .from("segment_config")
    .upsert({ key, values: cleaned, updated_at: new Date().toISOString(), updated_by: updatedBy });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/groups/new");
  return { ok: true, values: cleaned };
}
