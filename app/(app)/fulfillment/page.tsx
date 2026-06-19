import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { stageOf } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

type OrderItem = { productName?: string };

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function FulfillmentPage() {
  const db = createAdminClient();
  const { data: ordersRaw } = await db
    .from("customer_orders")
    .select("id, user_id, items, subscription_plan, total, status, printed_at, fulfilled_at, created_at")
    .order("created_at", { ascending: false });
  const orders = ordersRaw ?? [];

  const ids = [...new Set(orders.map((o) => o.user_id))];
  const { data: custs } = ids.length
    ? await db.from("customers").select("id, email").in("id", ids)
    : { data: [] as { id: string; email: string | null }[] };
  const emailById = new Map((custs ?? []).map((c) => [c.id, c.email]));

  const withStage = orders.map((o) => ({ o, stage: stageOf(o) }));
  const count = (k: string) => withStage.filter((x) => x.stage.key === k).length;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Fulfillment</h1>
          <p>Order queue and pack room. Reserved → Printed → Fulfilled.</p>
        </div>
      </div>

      <div className="minis" style={{ marginBottom: "var(--gap)" }}>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Reserved</span><span className="mv">{count("reserved")}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Printed</span><span className="mv">{count("printed")}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Fulfilled</span><span className="mv">{count("fulfilled")}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--danger)" }} />Cancelled</span><span className="mv">{count("cancelled")}</span></div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Order queue</h2><span className="sub">{orders.length} order(s)</span></div>
        <div className="card-b flush">
          {orders.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Plan</th><th className="right">Total</th><th>Stage</th><th>Age</th></tr></thead>
              <tbody>
                {withStage.map(({ o, stage }) => (
                  <tr key={o.id}>
                    <td><Link className="clink" href={`/fulfillment/${o.id}`}>#{o.id.slice(0, 8)}</Link></td>
                    <td className="cstrong">{emailById.get(o.user_id) ?? o.user_id.slice(0, 8)}</td>
                    <td className="muted">{Array.isArray(o.items) ? (o.items as OrderItem[]).length : 0}</td>
                    <td className="muted">{o.subscription_plan}</td>
                    <td className="right">€{Number(o.total).toFixed(2)}</td>
                    <td><span className={`chip ${stage.chip}`}><span className="cdot" />{stage.label}</span></td>
                    <td className="muted">{ago(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No orders.</div>
          )}
        </div>
      </div>
    </>
  );
}
