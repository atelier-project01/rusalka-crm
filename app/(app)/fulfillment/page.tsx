import { createAdminClient } from "@/lib/supabase/admin";
import FulfillmentClient, { type FulfillmentOrder } from "./fulfillment-client";

export const dynamic = "force-dynamic";

export default async function FulfillmentPage({ searchParams }: { searchParams: Promise<{ sel?: string }> }) {
  const { sel } = await searchParams;
  const db = createAdminClient();
  const { data: ordersRaw } = await db
    .from("customer_orders")
    .select("id, user_id, items, subscription_plan, subtotal, total, status, printed_at, fulfilled_at, created_at, shipping_name, shipping_city, shipping_country")
    .order("created_at", { ascending: false });
  const orders = (ordersRaw ?? []) as FulfillmentOrder[];

  const ids = [...new Set(orders.map((o) => o.user_id))];
  const { data: custs } = ids.length
    ? await db.from("customers").select("id, email").in("id", ids)
    : { data: [] as { id: string; email: string | null }[] };
  const emailById: Record<string, string | null> = {};
  (custs ?? []).forEach((c) => { emailById[c.id] = c.email; });

  return (
    <>
      <div className="pagehead">
        <div><h1>Fulfillment</h1><p>Order queue and pack room. Reserved → Printed → Fulfilled.</p></div>
      </div>
      <FulfillmentClient orders={orders} emailById={emailById} initialSelId={sel} />
    </>
  );
}
