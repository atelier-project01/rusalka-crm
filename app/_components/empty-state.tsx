/**
 * Neutral empty state used while a module has no data wired yet.
 * No placeholder/sample data — these render until real Supabase queries
 * are connected.
 */
export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div className="muted" style={{ fontWeight: 600, fontSize: "var(--fs-h2)" }}>{title}</div>
      {hint && (
        <div className="faint" style={{ marginTop: 6, fontSize: "var(--fs-sm)" }}>{hint}</div>
      )}
    </div>
  );
}
