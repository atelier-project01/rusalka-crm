"use client";

import { useState } from "react";
import { saveSegmentConfig } from "./actions";
import { type ConfigKey, type SegmentConfig } from "./config";

const SECTIONS: { key: ConfigKey; label: string; singular: string; hint: string }[] = [
  { key: "skin_types", label: "Skin types", singular: "skin type", hint: "Matched fuzzily — e.g. \"Oily\" also catches \"Combination: oily T-zone\"." },
  { key: "concerns", label: "Skin concerns", singular: "concern", hint: "From the consultation quiz. Remove duplicates / near-duplicates here." },
  { key: "lifecycle_stages", label: "Lifecycle stages", singular: "stage", hint: "Customer lifecycle values used across the CRM." },
  { key: "tags", label: "Tags", singular: "tag", hint: "Free-form tags applied to customers." },
];

const fld = { height: 31, padding: "0 10px", fontSize: "var(--fs-sm)", border: "1px solid var(--border-2)", borderRadius: "var(--btn-r)", background: "var(--surface)", color: "var(--text-strong)", outline: "none", minWidth: 220 } as const;

export default function SegmentConfigEditor({ config, canEdit }: { config: SegmentConfig; canEdit: boolean }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {SECTIONS.map((s) => (
        <ListEditor key={s.key} sectionKey={s.key} label={s.label} singular={s.singular} hint={s.hint} initial={config[s.key]} canEdit={canEdit} />
      ))}
    </div>
  );
}

function ListEditor({ sectionKey, label, singular, hint, initial, canEdit }: {
  sectionKey: ConfigKey; label: string; singular: string; hint: string; initial: string[]; canEdit: boolean;
}) {
  const [items, setItems] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const add = () => {
    const v = input.trim();
    setInput("");
    if (!v || items.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setItems([...items, v]);
    setMsg(null);
  };
  const remove = (i: number) => { setItems(items.filter((_, idx) => idx !== i)); setMsg(null); };
  const save = async () => {
    setSaving(true); setMsg(null);
    const res = await saveSegmentConfig(sectionKey, items);
    setSaving(false);
    if (res.error) { setMsg(res.error); return; }
    if (res.values) setItems(res.values); // reflect cleaned + sorted
    setMsg("Saved ✓");
  };

  return (
    <div className="card">
      <div className="card-h">
        <h2>{label}</h2>
        <span className="sub">{items.length} value{items.length === 1 ? "" : "s"}</span>
      </div>
      <div className="card-b">
        <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>{hint}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: canEdit ? 12 : 0 }}>
          {items.length === 0 ? <span className="muted">None defined.</span> : items.map((it, i) => (
            <span key={it + i} className="chip neutral">
              <span className="cdot" />
              {it}
              {canEdit ? (
                <button type="button" onClick={() => remove(i)} aria-label={`Remove ${it}`}
                  style={{ marginLeft: 6, border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, fontSize: 11 }}>✕</button>
              ) : null}
            </span>
          ))}
        </div>
        {canEdit ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
              placeholder={`Add a ${singular}…`} style={fld} />
            <button className="btn sm" type="button" onClick={add}>Add</button>
            <button className="btn sm pri" type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            {msg ? <span className="muted">{msg}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
