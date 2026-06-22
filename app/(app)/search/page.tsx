import { createAdminClient } from "@/lib/supabase/admin";
import { createErpClient } from "@/lib/supabase/erp";
import RowLink from "@/app/_components/row-link";

export const dynamic = "force-dynamic";

/**
 * Global search across customers, orders, care items and GTINs. The top-bar
 * box submits here as ?q=. All four lookups run in one parallel batch.
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").replace(/[,()%]/g, "").trim();

  if (!term) {
    return (
      <>
        <div className="pagehead"><div><h1>Search</h1><p>Search customers, orders, care items and GTINs.</p></div></div>
        <div className="card"><div className="card-b muted" style={{ fontSize: "var(--fs-sm)", padding: "var(--pad)" }}>Type a query in the top bar.</div></div>
      </>
    );
  }

  const db = createAdminClient();
  const erp = createErpClient();
  const like = `%${term}%`;
  const [custRes, orderRes, careRes, gtinRes] = await Promise.all([
    db.from("customers").select("id, email, full_name, lifecycle_stage").or(`email.ilike.${like},full_name.ilike.${like}`).limit(20),
    db.from("customer_orders").select("id, total, status, shipping_name, shipping_email").or(`shipping_name.ilike.${like},shipping_email.ilike.${like}`).limit(20),
    db.from("care_items").select("id, subject, status").ilike("subject", like).limit(20),
    erp.from("gtin_pool").select("gtin, status, item_ref").or(`gtin.ilike.${like},item_ref.ilike.${like}`).limit(20),
  ]);
  const customers = custRes.data ?? [];
  const orders = orderRes.data ?? [];
  const care = careRes.data ?? [];
  const gtins = gtinRes.data ?? [];
  const total = customers.length + orders.length + care.length + gtins.length;

  return (
    <>
      <div className="pagehead"><div><h1>Search</h1><p>{total} result(s) for &ldquo;{term}&rdquo;</p></div></div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h"><h2>Customers</h2><span className="sub">{customers.length}</span></div>
        <div className="card-b flush">{customers.length ? (<div className="twrap"><table className="tbl"><tbody>
          {customers.map((c) => (
            <RowLink key={c.id} href={`/customers/${c.id}`}>
              <td className="cstrong">{c.full_name || c.email || c.id.slice(0, 8)}</td>
              <td className="muted">{c.email ?? "—"}</td>
              <td><span className="chip neutral">{c.lifecycle_stage}</span></td>
            </RowLink>
          ))}
        </tbody></table></div>) : <div className="muted" style={{ padding: "var(--pad)", fontSize: "var(--fs-sm)" }}>No customers.</div>}</div>
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h"><h2>Orders</h2><span className="sub">{orders.length}</span></div>
        <div className="card-b flush">{orders.length ? (<div className="twrap"><table className="tbl"><tbody>
          {orders.map((o) => (
            <RowLink key={o.id} href={`/fulfillment/${o.id}`}>
              <td className="cstrong">#{o.id.slice(0, 8)}</td>
              <td className="muted">{o.shipping_name ?? o.shipping_email ?? "—"}</td>
              <td><span className="chip neutral">{o.status}</span></td>
              <td className="right">€{Number(o.total).toFixed(2)}</td>
            </RowLink>
          ))}
        </tbody></table></div>) : <div className="muted" style={{ padding: "var(--pad)", fontSize: "var(--fs-sm)" }}>No orders.</div>}</div>
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h"><h2>Care items</h2><span className="sub">{care.length}</span></div>
        <div className="card-b flush">{care.length ? (<div className="twrap"><table className="tbl"><tbody>
          {care.map((c) => (
            <RowLink key={c.id} href={`/care?sel=${c.id}`}>
              <td className="cstrong">{c.subject}</td>
              <td><span className="chip neutral">{c.status}</span></td>
            </RowLink>
          ))}
        </tbody></table></div>) : <div className="muted" style={{ padding: "var(--pad)", fontSize: "var(--fs-sm)" }}>No care items.</div>}</div>
      </div>

      <div className="card">
        <div className="card-h"><h2>GTINs</h2><span className="sub">{gtins.length}</span></div>
        <div className="card-b flush">{gtins.length ? (<div className="twrap"><table className="tbl"><tbody>
          {gtins.map((g) => (
            <RowLink key={g.gtin} href={`/barcode?sel=${g.gtin}`}>
              <td className="cstrong" style={{ fontFamily: "ui-monospace, monospace" }}>{g.gtin}</td>
              <td className="muted">{g.item_ref ?? "—"}</td>
              <td><span className="chip neutral">{g.status}</span></td>
            </RowLink>
          ))}
        </tbody></table></div>) : <div className="muted" style={{ padding: "var(--pad)", fontSize: "var(--fs-sm)" }}>No GTINs.</div>}</div>
      </div>
    </>
  );
}
