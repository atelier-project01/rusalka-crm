import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { stageOf } from "@/lib/fulfillment";
import { advanceOrder, cancelOrder } from "./actions";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";
type OrderItem = { productName?: string; category?: string; price?: number };
function ago(iso: string) { const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6); return h < 1 ? "now" : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`; }

export default async function FulfillmentPage({ searchParams }: { searchParams: Promise<{ sel?: string }> }) {
  const { sel } = await searchParams;
  const db = createAdminClient();
  const { data: ordersRaw } = await db
    .from("customer_orders").select("id, user_id, items, subscription_plan, subtotal, total, status, printed_at, fulfilled_at, created_at, shipping_name, shipping_city, shipping_country")
    .order("created_at", { ascending: false });
  const orders = ordersRaw ?? [];
  const ids = [...new Set(orders.map((o) => o.user_id))];
  const { data: custs } = ids.length ? await db.from("customers").select("id, email").in("id", ids) : { data: [] as { id: string; email: string | null }[] };
  const emailById = new Map((custs ?? []).map((c) => [c.id, c.email]));
  const withStage = orders.map((o) => ({ o, stage: stageOf(o) }));
  const count = (k: string) => withStage.filter((x) => x.stage.key === k).length;
  const selected = orders.find((o) => o.id === sel) ?? orders[0];
  const selItems = (Array.isArray(selected?.items) ? selected!.items : []) as OrderItem[];
  const selStage = selected ? stageOf(selected) : null;

  return (
    <>
      <div className="pagehead">
        <div><h1>Fulfillment</h1><p>Order queue and pack room. Reserved → Printed → Fulfilled.</p></div>
      </div>
      <div className="work">
        <div className="w-top">
          <div className="minis">
            <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Reserved</span><span className="mv">{count("reserved")}</span></div>
            <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Printed</span><span className="mv">{count("printed")}</span></div>
            <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Fulfilled</span><span className="mv">{count("fulfilled")}</span></div>
            <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--danger)" }} />Cancelled</span><span className="mv">{count("cancelled")}</span></div>
          </div>
        </div>

        <div className="w-main">
          <div className="card">
            <div className="card-h"><h2>Order queue</h2><span className="sub">{orders.length} order(s)</span></div>
            <div className="card-b flush"><div className="twrap"><table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th className="right">Total</th><th>Stage</th><th>Age</th></tr></thead>
              <tbody>
                {withStage.map(({ o, stage }) => (
                  <tr key={o.id} className={selected && o.id === selected.id ? "sel" : ""}>
                    <td><Link className="clink" href={`/fulfillment?sel=${o.id}`}>#{o.id.slice(0, 8)}</Link></td>
                    <td className="cstrong">{emailById.get(o.user_id) ?? o.user_id.slice(0, 8)}</td>
                    <td className="muted">{Array.isArray(o.items) ? (o.items as OrderItem[]).length : 0}</td>
                    <td className="right">€{Number(o.total).toFixed(2)}</td>
                    <td><span className={`chip ${stage.chip}`}><span className="cdot" />{stage.label}</span></td>
                    <td className="muted">{ago(o.created_at)}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={6} className="muted">No orders.</td></tr>}
              </tbody>
            </table></div></div>
          </div>
        </div>

        <div className="w-side">
          {selected && selStage ? (
            <div className="col-card">
              <div className="minihead"><h3>Order #{selected.id.slice(0, 8)}</h3><span className="ha"><span className={`chip ${selStage.chip}`}><span className="cdot" />{selStage.label}</span></span></div>
              {selItems.map((it, i) => (<div className="lineitem" key={i}><div><div className="liname">{it.productName ?? "Item"}</div>{it.category ? <div className="lisub">{it.category}</div> : null}</div><span className="liprice">€{Number(it.price ?? 0).toFixed(2)}</span></div>))}
              <div className="linetotal"><span>Order total</span><span>€{Number(selected.total).toFixed(2)}</span></div>
              <div className="fieldrow"><span className="fk">Customer</span><span className="fv clink"><Link href={`/customers/${selected.user_id}`}>{emailById.get(selected.user_id) ?? "—"}</Link></span></div>
              <div className="fieldrow"><span className="fk">Plan</span><span className="fv">{selected.subscription_plan}</span></div>
              <div className="fieldrow"><span className="fk">Ship to</span><span className="fv">{[selected.shipping_name, selected.shipping_city, selected.shipping_country].filter(Boolean).join(", ") || "—"}</span></div>
              <div className="panelactions">
                <PrintButton />
                {(selStage.key === "reserved" || selStage.key === "printed") && (
                  <form action={advanceOrder}><input type="hidden" name="id" value={selected.id} /><button className="btn pri" type="submit" style={{ width: "100%" }}>{selStage.key === "reserved" ? "Advance to Printed" : "Advance to Fulfilled"}</button></form>
                )}
                {selStage.key !== "cancelled" && selStage.key !== "fulfilled" && (
                  <form action={cancelOrder}><input type="hidden" name="id" value={selected.id} /><button className="btn" type="submit" style={{ width: "100%" }}>Cancel order</button></form>
                )}
              </div>
            </div>
          ) : (
            <div className="col-card"><div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>Select an order.</div></div>
          )}
        </div>
      </div>
    </>
  );
}
