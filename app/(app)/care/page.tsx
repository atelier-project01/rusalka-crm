import { createAdminClient } from "@/lib/supabase/admin";
import CareClient, { type CareItem, type CareReply } from "./care-client";

export const dynamic = "force-dynamic";

export default async function CarePage({ searchParams }: { searchParams: Promise<{ sel?: string }> }) {
  const { sel } = await searchParams;
  const db = createAdminClient();

  const [{ data: itemsRaw }, { data: repliesRaw }] = await Promise.all([
    db.from("care_items")
      .select("id, customer_id, subject, body, status, assignee, resolution, linked_order_id, priority, due_at, created_at")
      .order("created_at", { ascending: false }),
    db.from("care_replies")
      .select("id, care_id, body, author, created_at")
      .order("created_at", { ascending: true }),
  ]);
  const items = (itemsRaw ?? []) as CareItem[];

  const repliesByCare: Record<string, CareReply[]> = {};
  (repliesRaw ?? []).forEach((r: CareReply) => { (repliesByCare[r.care_id] ??= []).push(r); });

  const ids = [...new Set(items.map((i) => i.customer_id))];
  const { data: custs } = ids.length
    ? await db.from("customers").select("id, email").in("id", ids)
    : { data: [] as { id: string; email: string | null }[] };
  const emailById: Record<string, string | null> = {};
  (custs ?? []).forEach((c) => { emailById[c.id] = c.email; });

  return (
    <>
      <div className="pagehead"><div><h1>Customer Care</h1><p>Log, triage and resolve care interactions.</p></div></div>
      <CareClient items={items} emailById={emailById} repliesByCare={repliesByCare} initialSelId={sel} />
    </>
  );
}
