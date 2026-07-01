"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { previewCount, listMembers, createSegment, filterOptions, type Rule, type Member } from "./actions";
import RowLink from "@/app/_components/row-link";
import { quizOptions } from "@/lib/quiz";

const PREVIEW_LIMIT = 50;

type Options = { skinTypes: string[]; lifecycles: string[]; countries: string[]; concerns: string[]; tags: string[] };

const FIELDS = [
  { key: "skin_type", label: "Skin type", input: "select", opt: "skinTypes" },
  { key: "concern", label: "Skin concern", input: "select", opt: "concerns" },
  { key: "customer_type", label: "Customer type", input: "enum" },
  { key: "lifecycle_stage", label: "Lifecycle stage", input: "select", opt: "lifecycles" },
  { key: "country", label: "Country", input: "select", opt: "countries" },
  { key: "tag", label: "Tag", input: "select", opt: "tags" },
  // Quiz (consultation) fields — options come fixed from the quiz definitions.
  { key: "age", label: "Age", input: "select", options: quizOptions(1) },
  { key: "region", label: "Region", input: "select", options: quizOptions(3) },
  { key: "environment", label: "Environment", input: "select", options: quizOptions(4) },
  { key: "skin_tone", label: "Skin tone", input: "select", options: quizOptions(18) },
  { key: "skin_conditions", label: "Skin conditions", input: "select", options: quizOptions(16) },
  { key: "ingredient_values", label: "Ingredient values", input: "select", options: quizOptions(25) },
  { key: "avoid_ingredients", label: "Ingredients to avoid", input: "select", options: quizOptions(29) },
  { key: "fragrance_pref", label: "Fragrance preference", input: "select", options: quizOptions(31) },
  { key: "retinol_experience", label: "Retinol experience", input: "select", options: quizOptions(27) },
  { key: "routine_steps", label: "Routine steps", input: "select", options: quizOptions(21) },
  { key: "pregnancy", label: "Pregnant / breastfeeding", input: "select", options: quizOptions(10) },
  { key: "last_order_before_days", label: "Last order over … days ago", input: "number", placeholder: "90" },
  { key: "total_spent_min", label: "Total spent ≥ (€)", input: "number", placeholder: "100" },
  { key: "order_count_min", label: "Order count ≥", input: "number", placeholder: "2" },
] as const;

const fld = { height: 31, padding: "0 10px", fontSize: "var(--fs-sm)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none" } as const;

// Checkbox dropdown for a multiselect filter value. Several picks in one row are
// OR'd together by the query (see applyRules); rows are still AND'd.
function MultiSelect({ options, selected, onChange, placeholder }: { options: string[]; selected: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  const label = selected.length === 0 ? placeholder : selected.length <= 2 ? selected.join(", ") : `${selected.length} selected`;
  return (
    <div ref={ref} style={{ position: "relative", minWidth: 210 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ ...fld, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", textAlign: "left", color: selected.length ? "var(--text-strong)" : "var(--text-muted)" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span aria-hidden style={{ opacity: 0.6, flex: "0 0 auto" }}>▾</span>
      </button>
      {open ? (
        <div style={{ position: "absolute", zIndex: 20, top: "calc(100% + 4px)", left: 0, minWidth: "100%", maxHeight: 240, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", boxShadow: "0 8px 24px rgba(0,0,0,.12)", padding: 4 }}>
          {options.length === 0 ? (
            <div style={{ padding: "8px 10px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>No values configured.</div>
          ) : options.map((o) => (
            <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", fontSize: "var(--fs-sm)", color: "var(--text-strong)", cursor: "pointer", borderRadius: 6 }}>
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Empty value for a freshly-picked field: multiselect fields start as an empty
// list, single-value fields as an empty string.
const emptyValueFor = (key: string): Rule["value"] => (FIELDS.find((x) => x.key === key)?.input === "select" ? [] : "");

export default function Builder() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([{ field: "skin_type", value: [] }]);
  const [opts, setOpts] = useState<Options | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { filterOptions().then(setOpts).catch(() => {}); }, []);

  const activeRules = useMemo(
    () => rules.filter((r) => (Array.isArray(r.value) ? r.value.length > 0 : r.value !== "" && r.value !== null && r.value !== undefined)),
    [rules],
  );
  const activeKey = JSON.stringify(activeRules);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCounting(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const parsed = JSON.parse(activeKey) as Rule[];
      const [countRes, listRes] = await Promise.all([previewCount(parsed), listMembers(parsed, PREVIEW_LIMIT)]);
      setCount(countRes.count);
      setMembers(listRes.members);
      setCounting(false);
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [activeKey]);

  const update = (i: number, patch: Partial<Rule>) => setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRules((rs) => [...rs, { field: "skin_type", value: [] }]);
  const removeRow = (i: number) => setRules((rs) => (rs.length === 1 ? [{ field: "skin_type", value: [] }] : rs.filter((_, idx) => idx !== i)));

  const optionsFor = (key: string): string[] => {
    const f = FIELDS.find((x) => x.key === key);
    if (!f || f.input !== "select") return [];
    if ("options" in f && Array.isArray(f.options)) return f.options;          // fixed quiz options
    if (!opts) return [];
    return "opt" in f ? (opts[(f as { opt: keyof Options }).opt] ?? []) : [];   // config/live-data options
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
              <select style={{ ...fld, minWidth: 210 }} value={r.field} onChange={(e) => update(i, { field: e.target.value, value: emptyValueFor(e.target.value) })}>
                {FIELDS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
              {f.input === "select" ? (
                <MultiSelect
                  options={optionsFor(r.field)}
                  selected={Array.isArray(r.value) ? r.value : r.value === "" || r.value === null || r.value === undefined ? [] : [String(r.value)]}
                  onChange={(next) => update(i, { value: next })}
                  placeholder="— choose —"
                />
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

      <div className="card-b flush" style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "baseline", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: "var(--fs-md)", color: "var(--text-strong)" }}>Preview</h2>
          <span className="sub">
            {counting ? "Loading…" : count && count > members.length ? `First ${members.length} of ${count}` : `${members.length} customer${members.length === 1 ? "" : "s"}`}
          </span>
        </div>
        {counting ? (
          <div className="card-b"><span className="muted">Loading customers…</span></div>
        ) : members.length === 0 ? (
          <div className="card-b"><span className="muted">No customers match these filters yet.</span></div>
        ) : (
          <div className="twrap">
            <table className="tbl">
              <thead>
                <tr><th>Customer</th><th>Email</th><th>Skin type</th><th>Type</th><th>Orders</th><th>Spent</th><th>Last order</th></tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <RowLink key={m.user_id} href={`/customers/${m.user_id}`}>
                    <td className="cstrong">{m.full_name || m.email || m.user_id.slice(0, 8)}</td>
                    <td className="muted">{m.email ?? "—"}</td>
                    <td className="muted">{m.skin_type ?? "—"}</td>
                    <td className="muted">{m.is_subscriber ? "Subscriber" : "One-time"}</td>
                    <td className="muted">{m.order_count}</td>
                    <td className="muted">€{Number(m.total_spent).toFixed(0)}</td>
                    <td className="muted">{m.last_order_at ? new Date(m.last_order_at).toLocaleDateString() : "—"}</td>
                  </RowLink>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
