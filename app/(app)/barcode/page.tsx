import { createErpClient } from "@/lib/supabase/erp";
import BarcodeClient, { type PoolRow } from "./barcode-client";

export const dynamic = "force-dynamic";

export default async function BarcodePage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; sel?: string }> }) {
  const { q, status, sel } = await searchParams;
  const query = (q ?? "").replace(/[,()]/g, "").trim();
  const erp = createErpClient();
  const [{ data: poolRaw }, { data: issuers }] = await Promise.all([
    erp.from("gtin_pool").select("gtin, status, symbology, issuer_id, item_ref, created_at").order("created_at", { ascending: false }),
    erp.from("gtin_issuers").select("id, brand, company_prefix, symbology"),
  ]);
  const pool = (poolRaw ?? []) as PoolRow[];
  const brandById: Record<string, string | null> = {};
  const prefixById: Record<string, string | null> = {};
  (issuers ?? []).forEach((i) => { brandById[i.id] = i.brand; prefixById[i.id] = i.company_prefix; });
  const counts = pool.reduce<Record<string, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});

  let rows = pool;
  if (status) rows = rows.filter((r) => r.status === status);
  if (query) { const ql = query.toLowerCase(); rows = rows.filter((r) => r.gtin.toLowerCase().includes(ql) || (r.item_ref ?? "").toLowerCase().includes(ql)); }
  rows = rows.slice(0, 100);

  // Prefetch product names for the shown rows so the detail panel is instant on
  // selection (no per-row query).
  const gtins = rows.map((r) => r.gtin);
  const { data: recs } = gtins.length
    ? await erp.from("gtin_product_records").select("gtin, name").in("gtin", gtins)
    : { data: [] as { gtin: string; name: string | null }[] };
  const nameByGtin: Record<string, string> = {};
  (recs ?? []).forEach((r) => { if (r.name) nameByGtin[r.gtin] = r.name; });

  return (
    <>
      <div className="pagehead"><div><h1>Barcode / GTIN</h1><p>GTIN pool, issuers and labels.</p></div></div>
      <BarcodeClient
        rows={rows}
        counts={counts}
        issuersCount={issuers?.length ?? 0}
        nameByGtin={nameByGtin}
        brandById={brandById}
        prefixById={prefixById}
        query={query}
        status={status}
        initialSelGtin={sel}
      />
    </>
  );
}
