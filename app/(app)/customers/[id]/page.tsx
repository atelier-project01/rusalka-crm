import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { addNote, setConsent, updateCustomer } from "./actions";
import { createCareItem } from "../../care/actions";
import RowLink from "@/app/_components/row-link";
import { Sparkles, Check } from "lucide-react";

export const dynamic = "force-dynamic";

const LIFECYCLE_CHIP: Record<string, string> = { lead: "info", customer: "ok", subscriber: "violet", churned: "neutral" };
const CARE_STATUS_CHIP: Record<string, string> = { new: "info", in_progress: "warn", resolved: "ok" };
type OrderItem = { productName?: string; category?: string; price?: number };

function when(iso: string) {
  const d = new Date(iso);
  const h = Math.floor((Date.now() - d.getTime()) / 3.6e6);
  if (h < 24) return h < 1 ? "just now" : `${h}h ago`;
  return d.toLocaleDateString();
}

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const user = await getCurrentUser();

  // Fetch the customer and all related records in ONE parallel batch (they only
  // depend on the id), and write the audit log alongside — instead of three
  // sequential round-trips (customer → audit → related). Cuts the time to open
  // a profile down to a single round-trip.
  const [
    { data: customer },
    { data: orders },
    { data: quizzes },
    { data: notes },
    { data: consentRows },
    { data: careItems },
  ] = await Promise.all([
    db.from("customers").select("id, email, full_name, lifecycle_stage, tags, created_at").eq("id", id).maybeSingle(),
    db.from("customer_orders").select("id, items, subscription_plan, subtotal, discount, total, status, created_at, next_shipment_at, shipping_name, shipping_address, shipping_postal_code, shipping_city, shipping_country, shipping_email, shipping_phone").eq("user_id", id).order("created_at", { ascending: false }),
    db.from("quiz_results").select("id, skin_type, concerns, fragrance_choice, recommended_serum, recommended_cleanser, recommended_moisturizer, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    db.from("customer_interactions").select("id, body, author, created_at").eq("customer_id", id).order("created_at", { ascending: true }),
    db.from("consents").select("opted_in, created_at").eq("customer_id", id).eq("channel", "marketing_email").order("created_at", { ascending: false }).limit(1),
    db.from("care_items").select("id, subject, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
    logAudit({ actorId: user?.id, actorEmail: user?.email, action: "view_customer", entityType: "customer", entityId: id }),
  ]);

  if (!customer) notFound();

  const consent = consentRows?.[0];
  const name = customer.full_name || customer.email || customer.id.slice(0, 8);
  const initials = (customer.full_name || customer.email || "?").slice(0, 2).toUpperCase();
  const ltv = (orders ?? []).reduce((s, o) => s + Number(o.total || 0), 0);
  const avg = orders && orders.length ? ltv / orders.length : 0;
  const gross = (orders ?? []).reduce((s, o) => s + Number(o.subtotal || 0), 0);
  const discounts = (orders ?? []).reduce((s, o) => s + Number(o.discount || 0), 0);
  const orderCount = orders?.length ?? 0;
  const firstOrder = orderCount ? orders![orderCount - 1] : undefined;
  const latest = orders?.[0];
  const daysSinceLast = latest ? Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 864e5) : null;
  const latestItems = (Array.isArray(latest?.items) ? latest!.items : []) as OrderItem[];

  // Recent activity timeline (merge orders + quizzes + care)
  const activity = [
    ...(orders ?? []).map((o) => ({ t: o.created_at, label: `Order #${o.id.slice(0, 8)} — €${Number(o.total).toFixed(2)} (${o.status})` })),
    ...(quizzes ?? []).map((q) => ({ t: q.created_at, label: `Completed consultation — ${q.skin_type}` })),
    ...(careItems ?? []).map((c) => ({ t: c.created_at, label: `Care: ${c.subject} (${c.status})` })),
  ].sort((a, b) => +new Date(b.t) - +new Date(a.t)).slice(0, 6);

  // Next best actions (data-driven suggestions)
  const nba: { done: boolean; text: string; tag: string }[] = [
    { done: !!consent, text: consent ? "Marketing consent on record" : "Capture marketing consent", tag: consent ? "Done" : "GDPR" },
    { done: (careItems ?? []).some((c) => c.status === "resolved") && !(careItems ?? []).some((c) => c.status !== "resolved"), text: (careItems ?? []).some((c) => c.status !== "resolved") ? "Resolve open care item" : "No open care items", tag: "Care" },
    { done: (notes ?? []).length > 0, text: (notes ?? []).length ? "Notes on file" : "Add an internal note", tag: "Notes" },
  ];

  return (
    <>
      <div className="casebar">
        <div className="ct">
          <div className="crumbs" style={{ marginBottom: 4 }}>
            <Link className="clink" href="/customers">Customer 360</Link><span className="sep">/</span><span className="muted">{name}</span>
          </div>
          <h1>{name}</h1>
        </div>
        <div className="cr">
          <span className={`chip ${LIFECYCLE_CHIP[customer.lifecycle_stage] ?? "neutral"}`}><span className="cdot" />{customer.lifecycle_stage}</span>
        </div>
      </div>

      <div className="cockpit">
        <div className="ck-col ck-left">
        {/* profile */}
        <div className="ck-profile col-card profile">
          <div className="pav">{initials}</div>
          <div className="pmain">
            <div className="pname">{name}</div>
            <div className="pmail">{customer.email ?? "—"}</div>
            <div className="pbadges">
              <span className={`chip ${LIFECYCLE_CHIP[customer.lifecycle_stage] ?? "neutral"}`}><span className="cdot" />{customer.lifecycle_stage}</span>
              {customer.tags?.length ? <span className="tag">{customer.tags.join(", ")}</span> : null}
              <span className={`chip ${consent ? (consent.opted_in ? "ok" : "neutral") : "neutral"}`}><span className="cdot" />{consent ? (consent.opted_in ? "Opted in" : "Opted out") : "No consent"}</span>
            </div>
            <form action={setConsent} style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input type="hidden" name="customerId" value={id} /><input type="hidden" name="channel" value="marketing_email" />
              <button className="btn sm" type="submit" name="optedIn" value="true">Opt in</button>
              <button className="btn sm" type="submit" name="optedIn" value="false">Opt out</button>
            </form>
          </div>
          <div className="stats">
            <div className="s"><span className="sl">LTV</span><span className="sv">€{ltv.toFixed(0)}</span></div>
            <div className="s"><span className="sl">Avg order</span><span className="sv">€{avg.toFixed(0)}</span></div>
            <div className="s"><span className="sl">Orders</span><span className="sv">{orders?.length ?? 0}</span></div>
          </div>
        </div>

        {/* recent activity */}
        <div className="ck-activity col-card">
          <div className="minihead"><h3>Recent activity</h3></div>
          <div className="acts">
            {activity.length ? activity.map((a, i) => (
              <div className="actrow" key={i}><span className={`ad${i ? " g" : ""}`} /><div className="ab2"><div className="aw2">{when(a.t)}</div><div className="att2">{a.label}</div></div></div>
            )) : <div className="actrow"><div className="ab2"><div className="att2 muted">No activity yet</div></div></div>}
          </div>
        </div>

        {/* latest order */}
        <div className="ck-order col-card">
          <div className="minihead"><h3>{latest ? `Order #${latest.id.slice(0, 8)}` : "Orders"}</h3>{latest ? <span className="ha"><span className="chip neutral">{latest.status}</span></span> : null}</div>
          {latest ? (<>
            {latestItems.map((it, i) => (<div className="lineitem" key={i}><div><div className="liname">{it.productName ?? "Item"}</div>{it.category ? <div className="lisub">{it.category}</div> : null}</div><span className="liprice">€{Number(it.price ?? 0).toFixed(2)}</span></div>))}
            <div className="linetotal"><span>Order total</span><span>€{Number(latest.total).toFixed(2)}</span></div>
          </>) : <div className="lineitem"><div className="liname muted">No orders</div></div>}
        </div>

        {/* contact & shipping (from the most recent order) */}
        <div className="ck-contact col-card">
          <div className="minihead"><h3>Contact &amp; shipping</h3></div>
          <div className="fieldrow"><span className="fk">Email</span><span className="fv">{latest?.shipping_email ?? customer.email ?? "—"}</span></div>
          <div className="fieldrow"><span className="fk">Ship to</span><span className="fv">{latest?.shipping_name ?? customer.full_name ?? "—"}</span></div>
          <div className="fieldrow"><span className="fk">Address</span><span className="fv">{latest ? ([latest.shipping_address, latest.shipping_postal_code, latest.shipping_city, latest.shipping_country].filter(Boolean).join(", ") || "—") : "—"}</span></div>
          <div className="fieldrow"><span className="fk">Phone</span><span className="fv">{latest?.shipping_phone ?? "Not captured"}</span></div>
        </div>

        </div>
        <div className="ck-col ck-center">
        {/* conversation -> internal notes */}
        <div className="ck-convo col-card convo">
          <div className="card-h"><h2>Notes</h2><span className="sub">internal timeline</span><div className="ha"><span className="chip neutral">{notes?.length ?? 0}</span></div></div>
          <div className="feed">
            {notes?.length ? notes.map((n) => (
              <div className="msg me" key={n.id}><div className="meta">{n.author ?? "staff"} · {when(n.created_at)}</div><div className="bubble">{n.body}</div></div>
            )) : <div className="sysline">No notes yet</div>}
          </div>
          <div className="composer">
            <form action={addNote}>
              <input type="hidden" name="customerId" value={id} />
              <div className="cbox"><textarea name="body" placeholder={`Write an internal note about ${name}…`} required /></div>
              <div className="ctools"><span className="spacer" /><button className="btn sm pri" type="submit">Add note</button></div>
            </form>
          </div>
        </div>

        </div>
        <div className="ck-col ck-right">
        {/* summary (data snapshot, not an AI model) */}
        <div className="ck-ai ai">
          <div className="aih" style={{ borderBottom: "1px solid var(--border)" }}><span className="spark"><Sparkles size={16} /></span><h3>Summary</h3></div>
          <div className="fieldrow"><span className="fk">Lifecycle</span><span className="fv"><span className={`chip ${LIFECYCLE_CHIP[customer.lifecycle_stage] ?? "neutral"}`}><span className="cdot" />{customer.lifecycle_stage}</span></span></div>
          <div className="fieldrow"><span className="fk">Orders</span><span className="fv">{orders?.length ?? 0}</span></div>
          <div className="fieldrow"><span className="fk">Net revenue</span><span className="fv">€{ltv.toFixed(0)}</span></div>
          <div className="fieldrow"><span className="fk">Gross (subtotal)</span><span className="fv">€{gross.toFixed(0)}</span></div>
          <div className="fieldrow"><span className="fk">Discounts</span><span className="fv">{discounts > 0 ? `−€${discounts.toFixed(0)}` : "€0"}</span></div>
          <div className="fieldrow"><span className="fk">Avg order</span><span className="fv">€{avg.toFixed(0)}</span></div>
          <div className="fieldrow"><span className="fk">First order</span><span className="fv">{firstOrder ? new Date(firstOrder.created_at).toLocaleDateString() : "—"}</span></div>
          <div className="fieldrow"><span className="fk">Days since last</span><span className="fv">{daysSinceLast === null ? "—" : `${daysSinceLast}d`}</span></div>
          <div className="fieldrow"><span className="fk">Consultations</span><span className="fv">{quizzes?.length ?? 0}</span></div>
          <div className="fieldrow"><span className="fk">Marketing consent</span><span className="fv">{consent ? (consent.opted_in ? "Opted in" : "Opted out") : "Not captured"}</span></div>
          <div className="fieldrow"><span className="fk">Open care items</span><span className="fv">{(careItems ?? []).filter((c) => c.status !== "resolved").length}</span></div>
        </div>

        {/* next best action */}
        <div className="ck-nba nba">
          <div className="nh"><h3>Next best action</h3><p>Suggested steps for this customer.</p></div>
          <div className="steps">
            {nba.map((s, i) => (
              <div className={`step${s.done ? " is-done" : ""}`} key={i}>
                <span className={`sc ${s.done ? "done" : "todo"}`}>{s.done ? <Check size={13} /> : null}</span>
                <span className="stx">{s.text}</span><span className="sm">{s.tag}</span>
              </div>
            ))}
            <form action={createCareItem} style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input type="hidden" name="customerId" value={id} />
              <input name="subject" required placeholder="Log a care item…" style={{ flex: 1, height: 31, padding: "0 10px", fontSize: "var(--fs-xs)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" }} />
              <button className="btn sm" type="submit">Log</button>
            </form>
          </div>
        </div>
        </div>
      </div>

      {(latest?.subscription_plan || latest?.next_shipment_at) ? (
        <div className="card" style={{ marginTop: "var(--gap)" }}>
          <div className="card-h"><h2>Subscription</h2></div>
          <div className="card-b flush">
            <div className="fieldrow"><span className="fk">Plan</span><span className="fv">{latest.subscription_plan ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Next shipment</span><span className="fv">{latest.next_shipment_at ? new Date(latest.next_shipment_at).toLocaleDateString() : "—"}</span></div>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: "var(--gap)" }}>
        <div className="card-h"><h2>Order history</h2><span className="sub">{orderCount} order(s)</span></div>
        <div className="card-b flush">{orders && orders.length ? (<div className="twrap"><table className="tbl">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="right">Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <RowLink key={o.id} href={`/fulfillment/${o.id}`}>
                <td className="cstrong">#{o.id.slice(0, 8)}</td>
                <td className="muted">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="muted">{Array.isArray(o.items) ? (o.items as OrderItem[]).length : 0}</td>
                <td><span className="chip neutral">{o.status}</span></td>
                <td className="right">€{Number(o.total).toFixed(2)}</td>
              </RowLink>
            ))}
          </tbody>
        </table></div>) : <div className="muted" style={{ padding: "var(--pad)", fontSize: "var(--fs-sm)" }}>No orders.</div>}</div>
      </div>

      {quizzes && quizzes.length ? (
        <div className="card" style={{ marginTop: "var(--gap)" }}>
          <div className="card-h"><h2>Latest consultation</h2><span className="sub">{when(quizzes[0].created_at)}</span></div>
          <div className="card-b flush">
            <div className="fieldrow"><span className="fk">Skin type</span><span className="fv">{quizzes[0].skin_type ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Concerns</span><span className="fv">{Array.isArray(quizzes[0].concerns) ? quizzes[0].concerns.join(", ") : (quizzes[0].concerns ?? "—")}</span></div>
            <div className="fieldrow"><span className="fk">Fragrance</span><span className="fv">{quizzes[0].fragrance_choice ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Serum</span><span className="fv">{quizzes[0].recommended_serum ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Cleanser</span><span className="fv">{quizzes[0].recommended_cleanser ?? "—"}</span></div>
            <div className="fieldrow"><span className="fk">Moisturizer</span><span className="fv">{quizzes[0].recommended_moisturizer ?? "—"}</span></div>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: "var(--gap)" }}>
        <div className="card-h"><h2>Edit customer</h2></div>
        <div className="card-b">
          <form action={updateCustomer} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
            <input type="hidden" name="customerId" value={id} />
            <label style={{ display: "grid", gap: 4 }}><span className="fk">Full name</span>
              <input name="full_name" defaultValue={customer.full_name ?? ""} placeholder="Full name" style={{ height: 31, padding: "0 10px", fontSize: "var(--fs-sm)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" }} /></label>
            <label style={{ display: "grid", gap: 4 }}><span className="fk">Lifecycle stage</span>
              <select name="lifecycle_stage" defaultValue={customer.lifecycle_stage} style={{ height: 31, padding: "0 10px", fontSize: "var(--fs-sm)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" }}>
                <option value="lead">lead</option><option value="customer">customer</option><option value="subscriber">subscriber</option><option value="churned">churned</option>
              </select></label>
            <label style={{ display: "grid", gap: 4 }}><span className="fk">Tags (comma-separated)</span>
              <input name="tags" defaultValue={(customer.tags ?? []).join(", ")} placeholder="vip, wholesale" style={{ height: 31, padding: "0 10px", fontSize: "var(--fs-sm)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" }} /></label>
            <div><button className="btn pri sm" type="submit">Save changes</button></div>
          </form>
        </div>
      </div>

      {careItems && careItems.length > 0 ? (
        <div className="muted" style={{ fontSize: "var(--fs-xs)", marginTop: "var(--gap)" }}>
          Care items: {careItems.map((c) => <span key={c.id} style={{ marginRight: 10 }}><span className={`chip ${CARE_STATUS_CHIP[c.status] ?? "neutral"}`}>{c.status}</span> {c.subject}</span>)}
        </div>
      ) : null}
    </>
  );
}
