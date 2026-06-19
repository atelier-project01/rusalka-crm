import { createErpClient } from "@/lib/supabase/erp";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  available: "ok",
  reserved: "warn",
  used: "info",
  activated: "violet",
  voided: "danger",
};

type PoolRow = {
  gtin: string;
  status: string;
  symbology: string;
  issuer_id: string | null;
  item_ref: string | null;
  created_at: string;
};

export default async function BarcodePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const query = (q ?? "").replace(/[,()]/g, "").trim();

  const erp = createErpClient();
  const [{ data: poolRaw }, { data: issuers }] = await Promise.all([
    erp.from("gtin_pool").select("gtin, status, symbology, issuer_id, item_ref, created_at").order("created_at", { ascending: false }),
    erp.from("gtin_issuers").select("id, brand, company_prefix, symbology, pool_batch_size, pool_low_threshold, gs1_verified"),
  ]);
  const pool = (poolRaw ?? []) as PoolRow[];
  const brandById = new Map((issuers ?? []).map((i) => [i.id, i.brand]));

  const counts = pool.reduce<Record<string, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});

  let rows = pool;
  if (status) rows = rows.filter((r) => r.status === status);
  if (query) {
    const ql = query.toLowerCase();
    rows = rows.filter((r) => r.gtin.toLowerCase().includes(ql) || (r.item_ref ?? "").toLowerCase().includes(ql));
  }
  rows = rows.slice(0, 100);

  const statuses = ["available", "reserved", "used", "activated", "voided"];

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Barcode / GTIN</h1>
          <p>GTIN pool and issuers (read view). Assignment, Excel import and label generation are handled in the studio.</p>
        </div>
      </div>

      <div className="minis" style={{ marginBottom: "var(--gap)" }}>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Available</span><span className="mv">{counts.available ?? 0}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Reserved</span><span className="mv">{counts.reserved ?? 0}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Used</span><span className="mv">{counts.used ?? 0}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--violet)" }} />Issuers</span><span className="mv">{issuers?.length ?? 0}</span></div>
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div className="card-h"><h2>Issuers</h2><span className="sub">{issuers?.length ?? 0}</span></div>
        <div className="card-b flush">
          {issuers && issuers.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Brand</th><th>Prefix</th><th>Symbology</th><th>Batch</th><th>Low threshold</th><th>GS1</th></tr></thead>
              <tbody>
                {issuers.map((i) => (
                  <tr key={i.id}>
                    <td className="cstrong">{i.brand}</td>
                    <td className="muted">{i.company_prefix}</td>
                    <td className="muted">{i.symbology}</td>
                    <td className="muted">{i.pool_batch_size}</td>
                    <td className="muted">{i.pool_low_threshold}</td>
                    <td>{i.gs1_verified ? <span className="chip ok"><span className="cdot" />Verified</span> : <span className="chip neutral">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No issuers.</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>GTIN pool</h2>
          <span className="sub">{rows.length} shown</span>
          <div className="ha">
            <form method="get" style={{ display: "flex", gap: 6 }}>
              {status ? <input type="hidden" name="status" value={status} /> : null}
              <input
                name="q"
                defaultValue={query}
                placeholder="Search GTIN or ref…"
                style={{ height: 29, padding: "0 11px", fontSize: "var(--fs-xs)", fontFamily: "var(--font-body)", color: "var(--text-strong)", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", outline: "none" }}
              />
              <button className="btn sm" type="submit">Search</button>
            </form>
          </div>
        </div>
        <div className="card-b" style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 0, borderBottom: "1px solid var(--border)" }}>
          <a className={`chip ${!status ? "info" : "neutral"}`} href={`/barcode${query ? `?q=${encodeURIComponent(query)}` : ""}`}>All</a>
          {statuses.map((s) => (
            <a key={s} className={`chip ${status === s ? STATUS_CHIP[s] : "neutral"}`} href={`/barcode?status=${s}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>{s}</a>
          ))}
        </div>
        <div className="card-b flush">
          {rows.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>GTIN</th><th>Status</th><th>Symbology</th><th>Issuer</th><th>Ref</th><th>Created</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.gtin}>
                    <td className="cstrong" style={{ fontFamily: "ui-monospace, monospace" }}>{r.gtin}</td>
                    <td><span className={`chip ${STATUS_CHIP[r.status] ?? "neutral"}`}><span className="cdot" />{r.status}</span></td>
                    <td className="muted">{r.symbology}</td>
                    <td className="muted">{r.issuer_id ? brandById.get(r.issuer_id) ?? "—" : "—"}</td>
                    <td className="muted">{r.item_ref ?? "—"}</td>
                    <td className="muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>No GTINs match.</div>
          )}
        </div>
      </div>
    </>
  );
}
