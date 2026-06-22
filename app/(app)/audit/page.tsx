import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Admin-only viewer over the append-only crm_audit_log. Middleware already gates
 * the /audit module to admins; this re-checks server-side as defense in depth.
 */
export default async function AuditPage() {
  const user = await getCurrentUser();
  if (roleFromUser(user) !== "admin") redirect("/dashboard");

  const { data } = await createAdminClient()
    .from("crm_audit_log")
    .select("id, created_at, actor_email, action, entity_type, entity_id")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];

  return (
    <>
      <div className="pagehead"><div><h1>Audit log</h1><p>Recent sensitive actions — newest first (last 100).</p></div></div>
      <div className="card">
        <div className="card-h"><h2>Activity</h2><span className="sub">{rows.length}</span></div>
        <div className="card-b flush">{rows.length ? (<div className="twrap"><table className="tbl">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted">{new Date(r.created_at).toLocaleString()}</td>
                <td className="cstrong">{r.actor_email ?? "—"}</td>
                <td><span className="chip neutral">{r.action}</span></td>
                <td className="muted">{[r.entity_type, r.entity_id ? r.entity_id.slice(0, 8) : null].filter(Boolean).join(" ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>) : <div className="muted" style={{ padding: "var(--pad)", fontSize: "var(--fs-sm)" }}>No audit entries.</div>}</div>
      </div>
    </>
  );
}
