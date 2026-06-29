"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { previewCount, createSegment, filterOptions, type Rule } from "./actions";

type Options = { skinTypes: string[]; lifecycles: string[]; countries: string[]; concerns: string[]; tags: string[] };

const FIELDS = [
  { key: "skin_type", label: "Skin type", input: "select", opt: "skinTypes" },
  { key: "concern", label: "Skin concern", input: "select", opt: "concerns" },
  { key: "customer_type", label: "Customer type", input: "enum" },
  { key: "lifecycle_stage", label: "Lifecycle stage", input: "select", opt: "lifecycles" },
  { key: "country", label: "Country", input: "select", opt: "countries" },
  { key: "tag", label: "Tag", input: "select", opt: "tags" },
  { key: "last_order_before_days", label: "Last order over … days ago", input: "number", placeholder: "90" },
  { key: "total_spent_min", label: "Total spent ≥ (€)", input: "number", placeholder: "100" },
  { key: "order_count_min", label: "Order count ≥", input: "number", placeholder: "2" },
] as const;

const fld = { height: 31, padding: "0 10px", fontSize: "var(--fs-sm)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" } as const;

export default function Builder() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([{ field: "skin_type", value: "" }]);
  const [opts, setOpts] = useState<Options | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { filterOptions().then(setOpts).catch(() => {}); }, []);

  const activeRules = useMemo(
    () => rules.filter((r) => r.value !== "" && r.value !== null && r.value !== undefined),
    [rules],
  );
  const activeKey = JSON.stringify(activeRules);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCounting(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await previewCount(JSON.parse(activeKey) as Rule[]);
      setCount(res.count);
      setCounting(false);
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [activeKey]);

  const update = (i: number, patch: Partial<Rule>) => setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRules((rs) => [...rs, { field: "skin_type", value: "" }]);
  const removeRow = (i: number) => setRules((rs) => (rs.length === 1 ? [{ field: "skin_type", value: "" }] : rs.filter((_, idx) => idx !== i)));

  const optionsFor = (key: string): string[] => {
    const f = FIELDS.find((x) => x.key === key);
    if (!opts || !f || f.input !== "select") return [];
    return opts[(f as { opt: keyof Options }).opt] ?? [];
  };

  const save = async () => {
    setErr(null);
    if (!name.trim()) { setErr("Give the group a name."); return; }
    setSaving(true);
    const res = await createSegment({ name, description, rules: activeRules });
    if (res.error) { setErr(res.error); setSaving(false); return; }
    router.push(`/groups/${res.id}`);
  };

  return (
    <div className="card">
      <div className="card-h"><h2>Filters</h2><span className="sub">All conditions must match (AND)</span></div>
      <div className="card-b" style={{ display: "grid", gap: 10 }}>
        {rules.map((r, i) => {
          const f = FIELDS.find((x) => x.key === r.field) ?? FIELDS[0];
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select style={{ ...fld, minWidth: 210 }} value={r.field} onChange={(e) => update(i, { field: e.target.value, value: "" })}>
                {FIELDS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
              {f.input === "select" ? (
                <select style={{ ...fld, minWidth: 210 }} value={String(r.value)} onChange={(e) => update(i, { value: e.target.value })}>
                  <option value="">— choose —</option>
                  {optionsFor(r.field).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.input === "enum" ? (
                <select style={{ ...fld, minWidth: 160 }} value={String(r.value)} onChange={(e) => update(i, { value: e.target.value })}>
                  <option value="">— choose —</option>
                  <option value="subscriber">Subscriber</option>
                  <option value="onetime">One-time</option>
                </select>
              ) : (
                <input type="number" min="0" style={{ ...fld, width: 150 }} placeholder={(f as { placeholder?: string }).placeholder} value={String(r.value)} onChange={(e) => update(i, { value: e.target.value })} />
              )}
              <button className="btn sm" onClick={() => removeRow(i)} type="button" aria-label="Remove filter">✕</button>
            </div>
          );
        })}
        <div><button className="btn sm" type="button" onClick={addRow}>+ Add another filter</button></div>
      </div>

      <div className="card-b" style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)" }}>
          {counting ? "Counting…" : <><span>{count ?? 0}</span> <span style={{ fontWeight: 400, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>customers match</span></>}
        </div>
        <div className="sub" style={{ marginTop: 4 }}>Updates instantly as the filters change.</div>
      </div>

      <div className="card-b" style={{ borderTop: "1px solid var(--border)", display: "grid", gap: 8, maxWidth: 440 }}>
        <input style={fld} placeholder="Group name (e.g. Oily skin · lapsed subscribers)" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={fld} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        {err ? <div style={{ color: "#b4493f", fontSize: "var(--fs-sm)" }}>{err}</div> : null}
        <div><button className="btn sm pri" type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save living group"}</button></div>
      </div>
    </div>
  );
}
