import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { addNote, setConsent } from "./actions";
import { createCareItem } from "../../care/actions";

export const dynamic = "force-dynamic";

const LIFECYCLE_CHIP: Record<string, string> = {
  lead: "info",
  customer: "ok",
  subscriber: "violet",
  churned: "neutral",
};

const CARE_STATUS_CHIP: Record<string, string> = { new: "info", in_progress: "warn", resolved: "ok" };

type OrderItem = { productName?: string; category?: string; price?: number };

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();

  const { data: customer } = await db
    .from("customers")
    .select("id, email, full_name, lifecycle_stage, tags, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!customer) notFound();

  // Audit the PII access (who viewed which customer, when).
  const { data: { user } } = await (await createClient()).auth.getUser();
  await logAudit({
    actorId: user?.id,
    actorEmail: user?.email,
    action: "view_customer",
    entityType: "customer",
    entityId: id,
  });

  const [{ data: orders }, { data: quizzes }, { data: notes }, { data: consentRows }, { data: careItems }] = await Promise.all([
    db.from("customer_orders")
      .select("id, items, subscription_plan, total, status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    db.from("quiz_results")
      .select("id, skin_type, concerns, recommended_serum, recommended_cleanser, recommended_moisturizer, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    db.from("customer_interactions")
      .select("id, kind, body, author, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    db.from("consents")
      .select("opted_in, source, created_at")
      .eq("customer_id", id)
      .eq("channel", "marketing_email")
      .order("created_at", { ascending: false })
      .limit(1),
    db.from("care_items")
      .select("id, subject, status, assignee, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const consent = consentRows?.[0];

  const name = customer.full_name || customer.email || customer.id.slice(0, 8);
  const initials = (customer.full_name || customer.email || "?").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="casebar">
        <div className="ct">
          <div className="crumbs" style={{ marginBottom: 4 }}>
            <Link className="clink" href="/customers">Customer 360</Link>
            <span className="sep">/</span>
            <span className="muted">{name}</span>
          </div>
          <h1>{name}</h1>
        </div>
      </div>

      <div className="col-card profile" style={{ marginBottom: "var(--gap)" }}>
        <div className="pav">{initials}</div>
        <div className="pmain">
          <div className="pname">{name}</div>
          <div className="pmail">{customer.email ?? "—"}</div>
          <div className="pbadges">
            <span className={`chip ${LIFECYCLE_CHIP[customer.lifecycle_stage] ?? "neutral"}`}>
              <span className="cdot" />{customer.lifecycle_stage}
            </span>
            {customer.tags?.length ? <span className="tag">{customer.tags.join(", ")}</span> : null}
          </div>
        </div>
        <div className="stats">
          <div className="s"><span className="sl">Orders</span><span className="sv">{orders?.length ?? 0}</span></div>
          <div className="s"><span className="sl">Consultations</span><span className="sv">{quizzes?.length ?? 0}</span></div>
          <div className="s"><span className="sl">Joined</span><span className="sv">{new Date(customer.created_at).toLocaleDateString()}</span></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h">
          <h2>Marketing consent</h2>
          <span className="sub">email</span>
          <div className="ha">
            {consent ? (
              <span className={`chip ${consent.opted_in ? "ok" : "neutral"}`}>
                <span className="cdot" />{consent.opted_in ? "Opted in" : "Opted out"}
              </span>
            ) : (
              <span className="chip neutral">No record</span>
            )}
          </div>
        </div>
        <div className="card-b" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <form action={setConsent} style={{ display: "flex", gap: 8 }}>
            <input type="hidden" name="customerId" value={id} />
            <input type="hidden" name="channel" value="marketing_email" />
            <button className="btn sm" type="submit" name="optedIn" value="true">Opt in</button>
            <button className="btn sm" type="submit" name="optedIn" value="false">Opt out</button>
          </form>
          <span className="faint" style={{ fontSize: "var(--fs-xs)" }}>
            {consent ? `Last updated ${new Date(consent.created_at).toLocaleString()} · ${consent.source ?? ""}` : "GDPR — changes are audited"}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h"><h2>Orders</h2><span className="sub">{orders?.length ?? 0}</span></div>
        <div className="card-b flush">
          {orders && orders.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Order</th><th>Items</th><th>Plan</th><th className="right">Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="clink" href={`/fulfillment/${o.id}`}>#{o.id.slice(0, 8)}</Link></td>
                    <td className="muted">{Array.isArray(o.items) ? (o.items as OrderItem[]).length : 0}</td>
                    <td className="muted">{o.subscription_plan}</td>
                    <td className="right">€{Number(o.total).toFixed(2)}</td>
                    <td><span className="chip neutral">{o.status}</span></td>
                    <td className="muted">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No orders.</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Consultations</h2><span className="sub">{quizzes?.length ?? 0}</span></div>
        <div className="card-b flush">
          {quizzes && quizzes.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Skin type</th><th>Concerns</th><th>Recommended</th><th>Date</th></tr></thead>
              <tbody>
                {quizzes.map((qr) => (
                  <tr key={qr.id}>
                    <td className="cstrong">{qr.skin_type}</td>
                    <td className="muted">{Array.isArray(qr.concerns) ? qr.concerns.join(", ") : "—"}</td>
                    <td className="muted">
                      {[qr.recommended_cleanser, qr.recommended_serum, qr.recommended_moisturizer].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="muted">{new Date(qr.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No consultations.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "var(--gap)" }}>
        <div className="card-h"><h2>Care</h2><span className="sub">{careItems?.length ?? 0}</span></div>
        <form action={createCareItem} style={{ display: "flex", gap: 8, padding: "var(--pad)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          <input type="hidden" name="customerId" value={id} />
          <input
            name="subject"
            required
            placeholder="Log a care item…"
            style={{ flex: 1, minWidth: 220, height: 35, padding: "0 12px", fontSize: "var(--fs-sm)", fontFamily: "var(--font-body)", color: "var(--text-strong)", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", outline: "none" }}
          />
          <button className="btn pri sm" type="submit">Log care item</button>
        </form>
        <div className="card-b flush">
          {careItems && careItems.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Subject</th><th>Status</th><th>Assignee</th><th>Date</th></tr></thead>
              <tbody>
                {careItems.map((c) => (
                  <tr key={c.id}>
                    <td className="cstrong">{c.subject}</td>
                    <td><span className={`chip ${CARE_STATUS_CHIP[c.status] ?? "neutral"}`}><span className="cdot" />{c.status}</span></td>
                    <td className="muted">{c.assignee ?? "Unassigned"}</td>
                    <td className="muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No care items.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "var(--gap)" }}>
        <div className="card-h"><h2>Notes &amp; timeline</h2><span className="sub">{notes?.length ?? 0}</span></div>
        <form action={addNote} style={{ display: "flex", gap: 8, padding: "var(--pad)", borderBottom: "1px solid var(--border)" }}>
          <input type="hidden" name="customerId" value={id} />
          <input
            name="body"
            required
            placeholder="Add an internal note…"
            style={{ flex: 1, height: 35, padding: "0 12px", fontSize: "var(--fs-sm)", fontFamily: "var(--font-body)", color: "var(--text-strong)", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", outline: "none" }}
          />
          <button className="btn pri sm" type="submit">Add note</button>
        </form>
        <div className="card-b flush">
          {notes && notes.length > 0 ? (
            <div className="notebox">
              {notes.map((n) => (
                <div className="nrow" key={n.id}>
                  {n.body}
                  <div className="nm">{n.author ?? "staff"} · {new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No notes yet.</div>
          )}
        </div>
      </div>
    </>
  );
}
