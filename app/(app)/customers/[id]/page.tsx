import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const LIFECYCLE_CHIP: Record<string, string> = {
  lead: "info",
  customer: "ok",
  subscriber: "violet",
  churned: "neutral",
};

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

  const [{ data: orders }, { data: quizzes }] = await Promise.all([
    db.from("customer_orders")
      .select("id, items, subscription_plan, total, status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    db.from("quiz_results")
      .select("id, skin_type, concerns, recommended_serum, recommended_cleanser, recommended_moisturizer, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

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
        <div className="card-h"><h2>Orders</h2><span className="sub">{orders?.length ?? 0}</span></div>
        <div className="card-b flush">
          {orders && orders.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Order</th><th>Items</th><th>Plan</th><th className="right">Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="clink">#{o.id.slice(0, 8)}</td>
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
    </>
  );
}
