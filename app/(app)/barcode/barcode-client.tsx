"use client";

import { useState } from "react";
import BarcodeImage from "./barcode-image";

const STATUS_CHIP: Record<string, string> = { available: "ok", reserved: "warn", used: "info", activated: "violet", voided: "danger" };

export type PoolRow = {
  gtin: string;
  status: string;
  symbology: string;
  issuer_id: string | null;
  item_ref: string | null;
  created_at: string;
};

/**
 * GTIN pool with master-detail. Search and status filters stay server-driven
 * (they change the dataset, so a refetch is correct), but selecting a row is
 * pure client state — instant, no navigation or refetch. Product names for the
 * shown rows are prefetched so the detail panel is instant too.
 */
export default function BarcodeClient({
  rows,
  counts,
  issuersCount,
  nameByGtin,
  brandById,
  prefixById,
  query,
  status,
  initialSelGtin,
}: {
  rows: PoolRow[];
  counts: Record<string, number>;
  issuersCount: number;
  nameByGtin: Record<string, string>;
  brandById: Record<string, string | null>;
  prefixById: Record<string, string | null>;
  query: string;
  status?: string;
  initialSelGtin?: string;
}) {
  const [selGtin, setSelGtin] = useState<string | null>(initialSelGtin ?? rows[0]?.gtin ?? null);
  const selected = rows.find((r) => r.gtin === selGtin) ?? rows[0] ?? null;
  const [fmt, setFmt] = useState<string | null>(null);
  const effFmt = fmt ?? (selected && /^\d{13}$/.test(selected.gtin) ? "EAN13" : selected && /^\d{12}$/.test(selected.gtin) ? "UPC" : "CODE128");

  const statuses = ["available", "reserved", "used", "activated", "voided"];
  const qp = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (status) p.set("status", status);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  };

  return (
    <div className="work">
      <div className="w-top"><div className="minis">
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Available</span><span className="mv">{counts.available ?? 0}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Reserved</span><span className="mv">{counts.reserved ?? 0}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Assigned</span><span className="mv">{(counts.used ?? 0) + (counts.activated ?? 0)}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--violet)" }} />Issuers</span><span className="mv">{issuersCount}</span></div>
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
              <tr
                key={r.gtin}
                className={`rowsel${selected && r.gtin === selected.gtin ? " sel" : ""}`}
                onClick={() => setSelGtin(r.gtin)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelGtin(r.gtin); } }}
                tabIndex={0}
              >
                <td className="cstrong" style={{ fontFamily: "ui-monospace, monospace" }}>{r.gtin}</td>
                <td className="muted">{r.item_ref ?? "—"}</td>
                <td><span className={`chip ${STATUS_CHIP[r.status] ?? "neutral"}`}><span className="cdot" />{r.status}</span></td>
                <td className="muted">{r.issuer_id ? brandById[r.issuer_id] ?? "—" : "—"}</td>
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
            <div className="barcode"><BarcodeImage value={selected.gtin} format={effFmt} /></div>
            <div className="barcode-cap">{selected.gtin}</div>
            <div className="fieldrow"><span className="fk">Product</span><span className="fv">{nameByGtin[selected.gtin] ?? selected.item_ref ?? "Unassigned"}</span></div>
            <div className="fieldrow"><span className="fk">Issuer</span><span className="fv">{selected.issuer_id ? brandById[selected.issuer_id] ?? "—" : "—"}</span></div>
            <div className="fieldrow"><span className="fk">Brand prefix</span><span className="fv">{selected.issuer_id ? prefixById[selected.issuer_id] ?? "—" : "—"}</span></div>
            <div className="fieldrow"><span className="fk">Format</span><span className="fv">{selected.symbology}</span></div>
            <div className="panelactions">
              <button className={`btn${effFmt === "EAN13" ? " pri" : ""}`} type="button" onClick={() => setFmt("EAN13")}>EAN-13</button>
              <button className={`btn${effFmt === "UPC" ? " pri" : ""}`} type="button" onClick={() => setFmt("UPC")}>UPC-A</button>
              <button className={`btn${effFmt === "CODE128" ? " pri" : ""}`} type="button" onClick={() => setFmt("CODE128")}>Code 128</button>
            </div>
          </div>
        ) : (
          <div className="col-card"><div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>Select a GTIN.</div></div>
        )}
      </div>
    </div>
  );
}
