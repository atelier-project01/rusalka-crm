import EmptyState from "@/app/_components/empty-state";

export default function DashboardPage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Overview Dashboard</h1>
          <p>Key operational and customer metrics, and what needs attention.</p>
        </div>
      </div>
      <EmptyState
        title="No metrics yet"
        hint="KPIs (orders awaiting fulfillment, new customers, active subscriptions, recent campaigns) and the attention list appear here once data is connected."
      />
    </>
  );
}
