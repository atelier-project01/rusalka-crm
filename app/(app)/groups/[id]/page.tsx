import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { listMembers, type Rule } from "../actions";
import DeleteGroupButton from "./delete-button";
import EmptyState from "@/app/_components/empty-state";
import RowLink from "@/app/_components/row-link";

export const dynamic = "force-dynamic";

const FIELD_LABEL: Record<string, string> = {
  skin_type: "Skin type contains",
  concern: "Has concern",
  customer_type: "Customer type",
  lifecycle_stage: "Lifecycle stage",
  country: "Country",
  tag: "Tag",
  age: "Age",
  region: "Region",
  environment: "Environment",
  skin_tone: "Skin tone",
  skin_conditions: "Skin condition",
  ingredient_values: "Ingredient value",
  avoid_ingredients: "Avoids",
  fragrance_pref: "Fragrance preference",
  retinol_experience: "Retinol experience",
  routine_steps: "Routine steps",
  pregnancy: "Pregnant / breastfeeding",
  last_order_before_days: "Last order over … days ago",
  total_spent_min: "Total spent ≥ €",
  order_count_min: "Order count ≥",
};

function ruleValueLabel(r: Rule): string {
  if (r.field === "customer_type") return r.value === "subscriber" ? "Subscriber" : "One-time";
  if (Array.isArray(r.value)) return r.value.join(", ");
  return String(r.value);
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const { data: segment } = await db
    .from("segments")
    .select("id, name, description, type, rules")
    .eq("id", id)
    .maybeSingle();
  if (!segment) notFound();

  const rules = (Array.isArray(segment.rules) ? segment.rules : []) as Rule[];
  const { members } = await listMembers(rules, 500);

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="crumbs" style={{ marginBottom: 4 }}>
            <Link className="clink" href="/groups">Customer Groups</Link><span className="sep">/</span><span className="muted">{segment.name}</span>
          </div>
          <h1>{segment.name}</h1>
          {segment.description ? <p>{segment.description}</p> : null}
        </div>
        <div style={{ marginLeft: "auto" }}><DeleteGroupButton id={segment.id} /></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h">
          <h2>Filters</h2>
          <span className="sub">{segment.type === "frozen" ? "Frozen snapshot" : "Living group · updates automatically"}</span>
        </div>
        <div className="card-b">
          {rules.length === 0 ? (
            <span className="muted">No filters — all customers.</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {rules.map((r, i) => (
                <span key={i} className="chip neutral"><span className="cdot" />{FIELD_LABEL[r.field] ?? r.field}: {ruleValueLabel(r)}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Members</h2>
          <span className="sub">{members.length}{members.length >= 500 ? "+" : ""} customers</span>
        </div>
        <div className="card-b flush">
          {members.length === 0 ? (
            <div className="card-b"><EmptyState title="No customers match" hint="Adjust the filters to widen the group." /></div>
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
      </div>
    </>
  );
}
