import EmptyState from "@/app/_components/empty-state";

export default function CarePage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Customer Care</h1>
          <p>Log, triage and resolve care interactions against the customer record.</p>
        </div>
      </div>
      <EmptyState
        title="No care items yet"
        hint="The care queue appears here once the care_items table is created and linked to customers."
      />
    </>
  );
}
