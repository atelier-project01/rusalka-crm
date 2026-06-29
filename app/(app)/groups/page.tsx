import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { previewCount, type Rule } from "./actions";
import EmptyState from "@/app/_components/empty-state";
import RowLink from "@/app/_components/row-link";

export const dynamic = "force-dynamic";

type SegmentRow = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  rules: Rule[];
  created_by: string | null;
  created_at: string;
};

export default async function GroupsPage() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("segments")
    .select("id, name, description, type, rules, created_by, created_at")
    .order("created_at", { ascending: false });

  const segments = (data ?? []) as SegmentRow[];
  const counts = await Promise.all(segments.map((s) => previewCount(Array.isArray(s.rules) ? s.rules : [])));

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Customer Groups</h1>
          <p>Smart customer groups built from quiz, order and profile data — like online-shopping filters, pointed at your own customers.</p>
        </div>
        <Link href="/groups/new" className="btn sm pri" style={{ marginLeft: "auto" }}>+ New group</Link>
      </div>

      {error ? (
        <EmptyState title="Could not load groups" hint={error.message} />
      ) : segments.length === 0 ? (
        <EmptyState title="No groups yet" hint="Create your first group to target customers by skin type, orders, location and more." />
      ) : (
        <div className="card">
          <div className="card-h">
            <h2>Groups</h2>
            <span className="sub">{segments.length} total</span>
          </div>
          <div className="card-b flush">
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr><th>Name</th><th>Type</th><th>Members</th><th>Created by</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {segments.map((s, i) => (
                    <RowLink key={s.id} href={`/groups/${s.id}`}>
                      <td className="cstrong">
                        {s.name}
                        {s.description ? <div className="muted" style={{ fontWeight: 400 }}>{s.description}</div> : null}
                      </td>
                      <td><span className="chip neutral"><span className="cdot" />{s.type === "frozen" ? "frozen" : "living"}</span></td>
                      <td className="muted">{counts[i].count}</td>
                      <td className="muted">{s.created_by ?? "—"}</td>
                      <td className="muted">{new Date(s.created_at).toLocaleDateString()}</td>
                    </RowLink>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
