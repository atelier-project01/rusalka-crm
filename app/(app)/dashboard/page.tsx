import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type OrderItem = { productName?: string };

export default async function DashboardPage() {
  const db = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();

  const [awaiting, newCust, subs, quizzes, customersRes, consentsRes, recentRes] = await Promise.all([
    db.from("customer_orders").select("*", { count: "exact", head: true }).is("fulfilled_at", null).neq("status", "cancelled"),
    db.from("customers").select("*", { count: "exact", head: true }).gte("created_at", since30),
    db.from("customers").select("*", { count: "exact", head: true }).eq("lifecycle_stage", "subscriber"),
    db.from("quiz_results").select("*", { count: "exact", head: true }),
    db.from("customers").select("id, email"),
    db.from("consents").select("customer_id"),
    db.from("customer_orders").select("id, user_id, items, subscription_plan, total, status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const customers = customersRes.data ?? [];
  const emailById = new Map(customers.map((c) => [c.id, c.email as string | null]));
  const consented = new Set((consentsRes.data ?? []).map((r) => r.customer_id));
  const noConsent = customers.filter((c) => !consented.has(c.id)).length;
  const recent = recentRes.data ?? [];

  const kpis = [
    { label: "Awaiting fulfillment", value: awaiting.count ?? 0, tone: "io-warn", href: "/fulfillment", foot: "Not yet fulfilled" },
    { label: "New customers (30d)", value: newCust.count ?? 0, tone: "io-info", href: "/customers", foot: "Signed up recently" },
    { label: "Active subscriptions", value: subs.count ?? 0, tone: "io-ok", href: "/customers", foot: "Subscriber lifecycle" },
    { label: "Consultations", value: quizzes.count ?? 0, tone: "io-violet", href: "/customers", foot: "Quiz results on file" },
  ];

  const attention: { tone: string; title: string; meta: string; href: string }[] = [];
  if ((awaiting.count ?? 0) > 0)
    attention.push({ tone: "io-warn", title: `${awaiting.count} order(s) awaiting fulfillment`, meta: "In the fulfillment queue", href: "/fulfillment" });
  if (noConsent > 0)
    attention.push({ tone: "io-danger", title: `${noConsent} customer(s) without a consent record`, meta: "GDPR — capture marketing consent", href: "/customers" });
  if ((newCust.count ?? 0) > 0)
    attention.push({ tone: "io-info", title: `${newCust.count} new customer(s) in the last 30 days`, meta: "Review and welcome", href: "/customers" });

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Overview</h1>
          <p>Key operational and customer metrics, and what needs attention.</p>
        </div>
      </div>

      <div className="dash">
        <div className="d-kpis">
          <div className="kpis">
            {kpis.map((k) => (
              <Link key={k.label} href={k.href} className="kpi" style={{ display: "block" }}>
                <div className="kt"><span className={`hicon ${k.tone}`} /><span className="kl">{k.label}</span></div>
                <div className="kv">{k.value}</div>
                <div className="kf">{k.foot}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="d-table">
          <div className="card">
            <div className="card-h"><h2>Recent orders</h2><span className="sub">latest {recent.length}</span></div>
            <div className="card-b flush">
              {recent.length > 0 ? (
                <div className="twrap"><table className="tbl">
                  <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Plan</th><th className="right">Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id}>
                        <td className="clink">#{o.id.slice(0, 8)}</td>
                        <td className="cstrong">{emailById.get(o.user_id) ?? o.user_id.slice(0, 8)}</td>
                        <td className="muted">{Array.isArray(o.items) ? (o.items as OrderItem[]).length : 0}</td>
                        <td className="muted">{o.subscription_plan}</td>
                        <td className="right">€{Number(o.total).toFixed(2)}</td>
                        <td><span className="chip neutral">{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              ) : (
                <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No orders yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="d-att">
          <div className="card">
            <div className="card-h"><h2>Needs attention</h2></div>
            <div className="card-b flush">
              {attention.length > 0 ? (
                <div className="attlist">
                  {attention.map((a, i) => (
                    <Link key={i} href={a.href} className="att">
                      <span className={`ic ${a.tone}`} />
                      <div className="ab"><div className="at">{a.title}</div><div className="am">{a.meta}</div></div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>All clear.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
