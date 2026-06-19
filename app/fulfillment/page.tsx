import EmptyState from "@/app/_components/empty-state";

export default function FulfillmentPage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Fulfillment</h1>
          <p>Order queue and pack room. Reserved → Printed → Fulfilled → Shipping.</p>
        </div>
      </div>
      <EmptyState
        title="No orders loaded"
        hint="The order queue appears here once the embedded Fulfillment Studio is wired to the existing customer_orders data."
      />
    </>
  );
}
