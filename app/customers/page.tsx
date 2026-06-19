import EmptyState from "@/app/_components/empty-state";

export default function CustomersPage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Customer 360</h1>
          <p>One authoritative record per customer: profile, orders, consultations, subscription, notes and consent.</p>
        </div>
      </div>
      <EmptyState
        title="No customers loaded"
        hint="The customer list and record view appear here once the customers table and the existing order/quiz data are connected."
      />
    </>
  );
}
