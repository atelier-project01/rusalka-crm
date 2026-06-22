"use client";

import { useState } from "react";
import Link from "next/link";
import { stageOf } from "@/lib/fulfillment";
import { advanceOrder, cancelOrder } from "./actions";
import PrintButton from "./print-button";

type OrderItem = { productName?: string; category?: string; price?: number };

export type FulfillmentOrder = {
  id: string;
  user_id: string;
  items: unknown;
  subscription_plan: string | null;
  subtotal: number | null;
  discount: number | null;
  total: number | null;
  status: string;
  printed_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  shipping_email: string | null;
};

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  return h < 1 ? "now" : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

/**
 * Master-detail order queue. Selection is held in client state, so clicking a
 * row updates the detail panel instantly — no navigation, no refetch (all the
 * detail data is already loaded with the list). The whole row is the click
 * target. Mutations stay server actions and preserve the selection across the
 * revalidation because it's keyed by id.
 */
export default function FulfillmentClient({
  orders,
  emailById,
  initialSelId,
}: {
  orders: FulfillmentOrder[];
  emailById: Record<string, string | null>;
  initialSelId?: string;
}) {
  const [selId, setSelId] = useState<string | null>(initialSelId ?? orders[0]?.id ?? null);
  const selected = orders.find((o) => o.id === selId) ?? orders[0] ?? null;

  const withStage = orders.map((o) => ({ o, stage: stageOf(o) }));
  const count = (k: string) => withStage.filter((x) => x.stage.key === k).length;
  const selItems = Array.isArray(selected?.items) ? (selected!.items as OrderItem[]) : [];
  const selStage = selected ? stageOf(selected) : null;

  return (
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
                <tr
                  key={o.id}
                  className={`rowsel${selected && o.id === selected.id ? " sel" : ""}`}
                  onClick={() => setSelId(o.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelId(o.id); } }}
                  tabIndex={0}
                >
                  <td className="cstrong">#{o.id.slice(0, 8)}</td>
                  <td className="cstrong">{emailById[o.user_id] ?? o.user_id.slice(0, 8)}</td>
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
            <div className="fieldrow"><span className="fk">Subtotal</span><span className="fv">€{Number(selected.subtotal ?? selected.total ?? 0).toFixed(2)}</span></div>
            {selected.discount ? <div className="fieldrow"><span className="fk">Discount</span><span className="fv">−€{Number(selected.discount).toFixed(2)}</span></div> : null}
            <div className="linetotal"><span>Order total</span><span>€{Number(selected.total).toFixed(2)}</span></div>
            <div className="fieldrow"><span className="fk">Customer</span><span className="fv clink"><Link href={`/customers/${selected.user_id}`}>{emailById[selected.user_id] ?? "—"}</Link></span></div>
            <div className="fieldrow"><span className="fk">Plan</span><span className="fv">{selected.subscription_plan ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Ship to</span><span className="fv">{selected.shipping_name ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Address</span><span className="fv">{[selected.shipping_address, selected.shipping_postal_code, selected.shipping_city, selected.shipping_country].filter(Boolean).join(", ") || "—"}</span></div>
            <div className="fieldrow"><span className="fk">Email</span><span className="fv">{selected.shipping_email ?? emailById[selected.user_id] ?? "—"}</span></div>
            <div className="panelactions">
              <PrintButton />
              <Link className="btn sm" href={`/fulfillment/${selected.id}`}>Open full order</Link>
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
  );
}
