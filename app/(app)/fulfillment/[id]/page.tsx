import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { stageOf } from "@/lib/fulfillment";
import { advanceOrder, cancelOrder } from "../actions";
import PrintButton from "../print-button";

export const dynamic = "force-dynamic";

type OrderItem = { productName?: string; category?: string; price?: number };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();

  const { data: order } = await db
    .from("customer_orders")
    .select("id, user_id, items, subscription_plan, subtotal, total, status, printed_at, fulfilled_at, created_at, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_country, shipping_postal_code")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const { data: customer } = await db
    .from("customers")
    .select("id, email, full_name")
    .eq("id", order.user_id)
    .maybeSingle();

  const stage = stageOf(order);
  const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];
  const canAdvance = stage.key === "reserved" || stage.key === "printed";
  const advanceLabel = stage.key === "reserved" ? "Advance to Printed" : "Advance to Fulfilled";
  const customerName = customer?.full_name || customer?.email || order.user_id.slice(0, 8);

  return (
    <>
      <div className="casebar">
        <div className="ct">
          <div className="crumbs" style={{ marginBottom: 4 }}>
            <Link className="clink" href="/fulfillment">Fulfillment</Link>
            <span className="sep">/</span>
            <span className="muted">#{order.id.slice(0, 8)}</span>
          </div>
          <h1>Order #{order.id.slice(0, 8)}</h1>
        </div>
        <div className="cr">
          <span className={`chip ${stage.chip}`}><span className="cdot" />{stage.label}</span>
          {canAdvance && (
            <form action={advanceOrder}><input type="hidden" name="id" value={order.id} /><button className="btn sm pri" type="submit">{advanceLabel}</button></form>
          )}
          <PrintButton />
          {stage.key !== "cancelled" && stage.key !== "fulfilled" && (
            <form action={cancelOrder}><input type="hidden" name="id" value={order.id} /><button className="btn sm" type="submit">Cancel order</button></form>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h"><h2>Line items</h2><span className="sub">{items.length}</span></div>
        <div className="card-b flush">
          {items.map((it, i) => (
            <div className="lineitem" key={i}>
              <div><div className="liname">{it.productName ?? "Item"}</div>{it.category ? <div className="lisub">{it.category}</div> : null}</div>
              <span className="liprice">€{Number(it.price ?? 0).toFixed(2)}</span>
            </div>
          ))}
          <div className="linetotal"><span>Order total</span><span>€{Number(order.total).toFixed(2)}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Customer &amp; shipping</h2></div>
        <div className="card-b flush">
          <div className="fieldrow"><span className="fk">Customer</span><span className="fv"><Link className="clink" href={`/customers/${order.user_id}`}>{customerName}</Link></span></div>
          <div className="fieldrow"><span className="fk">Plan</span><span className="fv">{order.subscription_plan}</span></div>
          <div className="fieldrow"><span className="fk">Ship to</span><span className="fv">{order.shipping_name ?? "—"}</span></div>
          <div className="fieldrow"><span className="fk">Address</span><span className="fv">{[order.shipping_address, order.shipping_city, order.shipping_postal_code, order.shipping_country].filter(Boolean).join(", ") || "—"}</span></div>
          <div className="fieldrow"><span className="fk">Email</span><span className="fv">{order.shipping_email ?? customer?.email ?? "—"}</span></div>
          <div className="fieldrow"><span className="fk">Phone</span><span className="fv">{order.shipping_phone ?? "Not captured"}</span></div>
          <div className="fieldrow"><span className="fk">Placed</span><span className="fv">{new Date(order.created_at).toLocaleString()}</span></div>
        </div>
      </div>
    </>
  );
}
