import Link from "next/link";
import { createErpClient } from "@/lib/supabase/erp";

export const dynamic = "force-dynamic";
const STATUS_CHIP: Record<string, string> = { available: "ok", reserved: "warn", used: "info", activated: "violet", voided: "danger" };
type PoolRow = { gtin: string; status: string; symbology: string; issuer_id: string | null; item_ref: string | null; created_at: string };

export default async function BarcodePage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; sel?: string }> }) {
  const { q, status, sel } = await searchParams;
  const query = (q ?? "").replace(/[,()]/g, "").trim();
  const erp = createErpClient();
  const [{ data: poolRaw }, { data: issuers }] = await Promise.all([
    erp.from("gtin_pool").select("gtin, status, symbology, issuer_id, item_ref, created_at").order("created_at", { ascending: false }),
    erp.from("gtin_issuers").select("id, brand, company_prefix, symbology"),
  ]);
  const pool = (poolRaw ?? []) as PoolRow[];
  const brandById = new Map((issuers ?? []).map((i) => [i.id, i.brand]));
  const prefixById = new Map((issuers ?? []).map((i) => [i.id, i.company_prefix]));
  const counts = pool.reduce<Record<string, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});

  let rows = pool;
  if (status) rows = rows.filter((r) => r.status === status);
  if (query) { const ql = query.toLowerCase(); rows = rows.filter((r) => r.gtin.toLowerCase().includes(ql) || (r.item_ref ?? "").toLowerCase().includes(ql)); }
  rows = rows.slice(0, 100);

  const selected = pool.find((r) => r.gtin === sel) ?? rows[0];
  const { data: rec } = selected ? await erp.from("gtin_product_records").select("name, net_content, variant").eq("gtin", selected.gtin).maybeSingle() : { data: null };
  const statuses = ["available", "reserved", "used", "activated", "voided"];
  const qp = (extra: Record<string, string>) => { const p = new URLSearchParams(); if (query) p.set("q", query); if (status) p.set("status", status); Object.entries(extra).forEach(([k, v]) => p.set(k, v)); return p.toString(); };

  return (
    <>
      <div className="pagehead"><div><h1>Barcode / GTIN</h1><p>GTIN pool, issuers and labels.</p></div></div>
      <div className="work">
        <div className="w-top"><div className="minis">
          <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Available</span><span className="mv">{counts.available ?? 0}</span></div>
          <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Reserved</span><span className="mv">{counts.reserved ?? 0}</span></div>
          <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Assigned</span><span className="mv">{(counts.used ?? 0) + (counts.activated ?? 0)}</span></div>
          <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--violet)" }} />Issuers</span><span className="mv">{issuers?.length ?? 0}</span></div>
        </div></div>

        <div className="w-main"><div className="card">
          <div className="card-h"><h2>GTIN pool</h2><span className="sub">{rows.length} shown</span>
            <div className="ha"><form method="get" style={{ display: "flex", gap: 6 }}>{status ? <input type="hidden" name="status" value={status} /> : null}<input name="q" defaultValue={query} placeholder="Search…" style={{ height: 29, padding: "0 11px", fontSize: "var(--fs-xs)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" }} /><button className="btn sm" type="submit">Search</button></form></div>
          </div>
          <div className="card-b" style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
            <a className={`chip ${!status ? "info" : "neutral"}`} href={`/barcode${query ? `?q=${encodeURIComponent(query)}` : ""}`}>all</a>
            {statuses.map((s) => <a key={s} className={`chip ${status === s ? STATUS_CHIP[s] : "neutral"}`} href={`/barcode?${qp({ status: s })}`}>{s}</a>)}
          </div>
          <div className="card-b flush"><div className="twrap"><table className="tbl">
            <thead><tr><th>GTIN</th><th>Product</th><th>Status</th><th>Issuer</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.gtin} className={selected && r.gtin === selected.gtin ? "sel" : ""}>
                  <td><Link className="clink" href={`/barcode?${qp({ sel: r.gtin })}`} style={{ fontFamily: "ui-monospace, monospace" }}>{r.gtin}</Link></td>
                  <td className="muted">{r.item_ref ?? "—"}</td>
                  <td><span className={`chip ${STATUS_CHIP[r.status] ?? "neutral"}`}><span className="cdot" />{r.status}</span></td>
                  <td className="muted">{r.issuer_id ? brandById.get(r.issuer_id) ?? "—" : "—"}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="muted">No GTINs match.</td></tr>}
            </tbody>
          </table></div></div>
        </div></div>

        <div className="w-side">
          {selected ? (
            <div className="col-card">
              <div className="minihead"><h3>GTIN detail</h3><span className="ha"><span className={`chip ${STATUS_CHIP[selected.status] ?? "neutral"}`}>{selected.status}</span></span></div>
              <div className="barcode" />
              <div className="barcode-cap">{selected.gtin}</div>
              <div className="fieldrow"><span className="fk">Product</span><span className="fv">{rec?.name ?? selected.item_ref ?? "Unassigned"}</span></div>
              <div className="fieldrow"><span className="fk">Issuer</span><span className="fv">{selected.issuer_id ? brandById.get(selected.issuer_id) ?? "—" : "—"}</span></div>
              <div className="fieldrow"><span className="fk">Brand prefix</span><span className="fv">{selected.issuer_id ? prefixById.get(selected.issuer_id) ?? "—" : "—"}</span></div>
              <div className="fieldrow"><span className="fk">Format</span><span className="fv">{selected.symbology}</span></div>
              <div className="panelactions">
                <button className="btn" type="button">Generate EAN</button>
                <button className="btn" type="button">Generate UPC</button>
              </div>
            </div>
          ) : (
            <div className="col-card"><div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>Select a GTIN.</div></div>
          )}
        </div>
      </div>
    </>
  );
}
