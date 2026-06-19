import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateCare } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = { new: "info", in_progress: "warn", resolved: "ok" };
const STATUS_LABEL: Record<string, string> = { new: "New", in_progress: "In progress", resolved: "Resolved" };

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function CarePage() {
  const db = createAdminClient();
  const { data: itemsRaw } = await db
    .from("care_items")
    .select("id, customer_id, subject, status, assignee, created_at")
    .order("created_at", { ascending: false });
  const items = itemsRaw ?? [];

  const ids = [...new Set(items.map((i) => i.customer_id))];
  const { data: custs } = ids.length
    ? await db.from("customers").select("id, email").in("id", ids)
    : { data: [] as { id: string; email: string | null }[] };
  const emailById = new Map((custs ?? []).map((c) => [c.id, c.email]));

  const open = items.filter((i) => i.status !== "resolved").length;
  const unassigned = items.filter((i) => !i.assignee && i.status !== "resolved").length;
  const resolved = items.filter((i) => i.status === "resolved").length;

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Customer Care</h1>
          <p>Log, triage and resolve care interactions against the customer record.</p>
        </div>
      </div>

      <div className="minis" style={{ marginBottom: "var(--gap)" }}>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--info)" }} />Open</span><span className="mv">{open}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--warn)" }} />Unassigned</span><span className="mv">{unassigned}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--ok)" }} />Resolved</span><span className="mv">{resolved}</span></div>
        <div className="mini"><span className="ml"><span className="mc" style={{ background: "var(--violet)" }} />Total</span><span className="mv">{items.length}</span></div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Care queue</h2><span className="sub">triage and assign</span></div>
        <div className="card-b flush">
          {items.length > 0 ? (
            <div className="twrap"><table className="tbl">
              <thead><tr><th>Subject</th><th>Customer</th><th>Status</th><th>Assignee</th><th>Age</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="cstrong">{it.subject}</td>
                    <td><Link className="clink" href={`/customers/${it.customer_id}`}>{emailById.get(it.customer_id) ?? it.customer_id.slice(0, 8)}</Link></td>
                    <td><span className={`chip ${STATUS_CHIP[it.status] ?? "neutral"}`}><span className="cdot" />{STATUS_LABEL[it.status] ?? it.status}</span></td>
                    <td className="muted">{it.assignee ?? "Unassigned"}</td>
                    <td className="muted">{ago(it.created_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <form action={updateCare}><input type="hidden" name="id" value={it.id} /><button className="btn sm" type="submit" name="assignToMe" value="true">Assign me</button></form>
                        {it.status !== "in_progress" && it.status !== "resolved" && (
                          <form action={updateCare}><input type="hidden" name="id" value={it.id} /><button className="btn sm" type="submit" name="status" value="in_progress">Start</button></form>
                        )}
                        {it.status !== "resolved" && (
                          <form action={updateCare}><input type="hidden" name="id" value={it.id} /><button className="btn sm pri" type="submit" name="status" value="resolved">Resolve</button></form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <div className="card-b muted" style={{ fontSize: "var(--fs-sm)" }}>
              No care items yet. Log one from a customer&apos;s record.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
