"use client";

import { useState } from "react";
import Link from "next/link";
import { updateCare } from "./actions";

const STATUS_CHIP: Record<string, string> = { new: "info", in_progress: "warn", resolved: "ok" };
const STATUS_LABEL: Record<string, string> = { new: "New", in_progress: "In progress", resolved: "Resolved" };

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  return h < 1 ? "now" : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

export type CareItem = {
  id: string;
  customer_id: string;
  subject: string;
  body: string | null;
  status: string;
  assignee: string | null;
  resolution: string | null;
  linked_order_id: string | null;
  created_at: string;
};

/**
 * Master-detail care queue. Selection is client state — clicking anywhere on a
 * row shows that item instantly, no navigation or refetch. Triage actions stay
 * server actions and keep the selection across revalidation (keyed by id).
 */
export default function CareClient({
  items,
  emailById,
  initialSelId,
}: {
  items: CareItem[];
  emailById: Record<string, string | null>;
  initialSelId?: string;
}) {
  const [selId, setSelId] = useState<string | null>(initialSelId ?? items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selId) ?? items[0] ?? null;

  const open = items.filter((i) => i.status !== "resolved").length;
  const unassigned = items.filter((i) => !i.assignee && i.status !== "resolved").length;
  const inprog = items.filter((i) => i.status === "in_progress").length;
  const resolved = items.filter((i) => i.status === "resolved").length;

  return (
    <div className="work">
      <div className="w-top"><div className="minis">
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Open</span><span className="mv">{open}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Unassigned</span><span className="mv">{unassigned}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--violet)" }} />In progress</span><span className="mv">{inprog}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Resolved</span><span className="mv">{resolved}</span></div>
      </div></div>

      <div className="w-main"><div className="card">
        <div className="card-h"><h2>Care queue</h2><span className="sub">triage and assign</span></div>
        <div className="card-b flush"><div className="twrap"><table className="tbl">
          <thead><tr><th>Subject</th><th>Customer</th><th>Status</th><th>Assignee</th><th>Age</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.id}
                className={`rowsel${selected && it.id === selected.id ? " sel" : ""}`}
                onClick={() => setSelId(it.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelId(it.id); } }}
                tabIndex={0}
              >
                <td className="cstrong">{it.subject}</td>
                <td className="muted">{emailById[it.customer_id] ?? "—"}</td>
                <td><span className={`chip ${STATUS_CHIP[it.status] ?? "neutral"}`}><span className="cdot" />{STATUS_LABEL[it.status] ?? it.status}</span></td>
                <td className="muted">{it.assignee ?? "Unassigned"}</td>
                <td className="muted">{ago(it.created_at)}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="muted">No care items. Log one from a customer&apos;s record.</td></tr>}
          </tbody>
        </table></div></div>
      </div></div>

      <div className="w-side">
        {selected ? (
          <div className="col-card">
            <div className="minihead"><h3>Care item</h3><span className="ha"><span className={`chip ${STATUS_CHIP[selected.status] ?? "neutral"}`}>{STATUS_LABEL[selected.status] ?? selected.status}</span></span></div>
            <div className="fieldrow"><span className="fk">Subject</span><span className="fv">{selected.subject}</span></div>
            <div className="fieldrow"><span className="fk">Customer</span><span className="fv clink"><Link href={`/customers/${selected.customer_id}`}>{emailById[selected.customer_id] ?? "—"}</Link></span></div>
            <div className="fieldrow"><span className="fk">Assignee</span><span className="fv">{selected.assignee ?? "Unassigned"}</span></div>
            {selected.linked_order_id ? <div className="fieldrow"><span className="fk">Linked order</span><span className="fv clink"><Link href={`/fulfillment?sel=${selected.linked_order_id}`}>#{selected.linked_order_id.slice(0, 8)}</Link></span></div> : null}
            <div className="notebox">
              <div className="nrow">{selected.body || "No description."}{selected.resolution ? <div className="nm">Resolution: {selected.resolution}</div> : null}</div>
            </div>
            <div className="panelactions">
              <form action={updateCare}><input type="hidden" name="id" value={selected.id} /><button className="btn" type="submit" name="assignToMe" value="true" style={{ width: "100%" }}>Assign to me</button></form>
              {selected.status !== "resolved" && <form action={updateCare}><input type="hidden" name="id" value={selected.id} /><button className="btn pri" type="submit" name="status" value="resolved" style={{ width: "100%" }}>Mark resolved</button></form>}
              <Link className="btn" href={`/customers/${selected.customer_id}`} style={{ width: "100%", justifyContent: "center" }}>Open Customer 360</Link>
            </div>
          </div>
        ) : (
          <div className="col-card"><div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>Select a care item.</div></div>
        )}
      </div>
    </div>
  );
}
