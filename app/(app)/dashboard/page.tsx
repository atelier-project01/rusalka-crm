import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stageOf } from "@/lib/fulfillment";
import { Package, UserPlus, RefreshCw, ClipboardCheck, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";
type OrderItem = { productName?: string };
function ago(iso: string) { const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6); return h < 1 ? "now" : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`; }

const ICONS = {
  box: <Package size={16} />,
  user: <UserPlus size={16} />,
  cycle: <RefreshCw size={16} />,
  quiz: <ClipboardCheck size={16} />,
  shield: <ShieldAlert size={16} />,
};

export default async function DashboardPage() {
  const db = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const who = (user?.email ?? "there").replace(/@.*/, "");

  const [awaiting, newCust, subs, quizzes, customersRes, consentsRes, queueRes] = await Promise.all([
    db.from("customer_orders").select("*", { count: "exact", head: true }).is("fulfilled_at", null).neq("status", "cancelled"),
    db.from("customers").select("*", { count: "exact", head: true }).gte("created_at", since30),
    db.from("customers").select("*", { count: "exact", head: true }).eq("lifecycle_stage", "subscriber"),
    db.from("quiz_results").select("*", { count: "exact", head: true }),
    db.from("customers").select("id, email"),
    db.from("consents").select("customer_id"),
    db.from("customer_orders").select("id, user_id, items, total, status, printed_at, fulfilled_at, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const customers = customersRes.data ?? [];
  const emailById = new Map(customers.map((c) => [c.id, c.email as string | null]));
  const consented = new Set((consentsRes.data ?? []).map((r) => r.customer_id));
  const noConsent = customers.filter((c) => !consented.has(c.id)).length;
  const queue = queueRes.data ?? [];

  const kpis = [
    { label: "Awaiting fulfillment", value: awaiting.count ?? 0, tone: "io-warn", icon: ICONS.box, href: "/fulfillment", foot: "Not yet fulfilled" },
    { label: "New customers (30d)", value: newCust.count ?? 0, tone: "io-info", icon: ICONS.user, href: "/customers", foot: "Signed up recently" },
    { label: "Active subscriptions", value: subs.count ?? 0, tone: "io-ok", icon: ICONS.cycle, href: "/customers", foot: "Subscriber lifecycle" },
    { label: "Consultations", value: quizzes.count ?? 0, tone: "io-violet", icon: ICONS.quiz, href: "/customers", foot: "Quiz results on file" },
  ];
  const attention: { tone: string; icon: React.ReactNode; title: string; meta: string; href: string }[] = [];
  if ((awaiting.count ?? 0) > 0) attention.push({ tone: "io-warn", icon: ICONS.box, title: `${awaiting.count} order(s) awaiting fulfillment`, meta: "In the fulfillment queue", href: "/fulfillment" });
  if (noConsent > 0) attention.push({ tone: "io-danger", icon: ICONS.shield, title: `${noConsent} customer(s) without a consent record`, meta: "GDPR — capture marketing consent", href: "/customers" });
  if ((newCust.count ?? 0) > 0) attention.push({ tone: "io-info", icon: ICONS.user, title: `${newCust.count} new customer(s) in 30 days`, meta: "Review and welcome", href: "/customers" });

  return (
    <>
      <div className="pagehead">
        <div><h1>Good day, {who}</h1><p>Here is what the team needs to look at today.</p></div>
      </div>

      <div className="dash">
        <div className="d-kpis"><div className="kpis">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="kpi" style={{ display: "block" }}>
              <div className="kt"><span className={`hicon ${k.tone}`}>{k.icon}</span><span className="kl">{k.label}</span></div>
              <div className="kv">{k.value}</div><div className="kf">{k.foot}</div>
            </Link>
          ))}
        </div></div>

        <div className="d-table"><div className="card">
          <div className="card-h"><h2>Fulfillment queue</h2><span className="sub">Reserved → Printed → Fulfilled</span><div className="ha"><Link className="btn sm ghost" href="/fulfillment">View all</Link></div></div>
          <div className="card-b flush">{queue.length ? (<div className="twrap"><table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Stage</th><th className="right">Total</th><th>Age</th></tr></thead>
            <tbody>{queue.map((o) => { const s = stageOf(o); return (
              <tr key={o.id}>
                <td><Link className="clink" href={`/fulfillment?sel=${o.id}`}>#{o.id.slice(0, 8)}</Link></td>
                <td className="cstrong">{emailById.get(o.user_id) ?? o.user_id.slice(0, 8)}</td>
                <td className="muted">{Array.isArray(o.items) ? (o.items as OrderItem[]).length : 0}</td>
                <td><span className={`chip ${s.chip}`}><span className="cdot" />{s.label}</span></td>
                <td className="right">€{Number(o.total).toFixed(2)}</td><td className="muted">{ago(o.created_at)}</td>
              </tr>); })}
            </tbody>
          </table></div>) : <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No orders yet.</div>}</div>
        </div></div>

        <div className="d-att"><div className="card">
          <div className="card-h"><h2>Needs attention</h2></div>
          <div className="card-b flush">{attention.length ? (<div className="attlist">
            {attention.map((a, i) => (<Link key={i} href={a.href} className="att"><span className={`ic ${a.tone}`}>{a.icon}</span><div className="ab"><div className="at">{a.title}</div><div className="am">{a.meta}</div></div></Link>))}
          </div>) : <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>All clear.</div>}</div>
        </div></div>
      </div>
    </>
  );
}
