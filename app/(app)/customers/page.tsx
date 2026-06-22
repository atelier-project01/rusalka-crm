import { createAdminClient } from "@/lib/supabase/admin";
import EmptyState from "@/app/_components/empty-state";
import RowLink from "@/app/_components/row-link";

export const dynamic = "force-dynamic";

type CustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  lifecycle_stage: string;
  tags: string[];
  created_at: string;
};

const LIFECYCLE_CHIP: Record<string, string> = {
  lead: "info",
  customer: "ok",
  subscriber: "violet",
  churned: "neutral",
};

export default async function CustomersPage() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("customers")
    .select("id, email, full_name, lifecycle_stage, tags, created_at")
    .order("created_at", { ascending: false });

  const customers = (data ?? []) as CustomerRow[];

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Customer 360</h1>
          <p>One authoritative record per customer: profile, orders, consultations, subscription, notes and consent.</p>
        </div>
      </div>

      {error ? (
        <EmptyState title="Could not load customers" hint={error.message} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers yet" hint="Customers appear here as they sign up on the storefront." />
      ) : (
        <div className="card">
          <div className="card-h">
            <h2>Customers</h2>
            <span className="sub">{customers.length} total</span>
          </div>
          <div className="card-b flush">
            <div className="twrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Lifecycle</th>
                    <th>Tags</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <RowLink key={c.id} href={`/customers/${c.id}`}>
                      <td className="cstrong">{c.full_name || c.email || c.id.slice(0, 8)}</td>
                      <td className="muted">{c.email ?? "—"}</td>
                      <td>
                        <span className={`chip ${LIFECYCLE_CHIP[c.lifecycle_stage] ?? "neutral"}`}>
                          <span className="cdot" />
                          {c.lifecycle_stage}
                        </span>
                      </td>
                      <td className="muted">{c.tags?.length ? c.tags.join(", ") : "—"}</td>
                      <td className="muted">{new Date(c.created_at).toLocaleDateString()}</td>
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
