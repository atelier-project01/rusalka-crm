"use client";

import { deleteCustomer } from "../actions";

/**
 * Destructive delete with a confirm guard. Admin-gated server-side too.
 */
export default function DeleteCustomerButton({ customerId }: { customerId: string }) {
  return (
    <form
      action={deleteCustomer}
      onSubmit={(e) => {
        if (!confirm("Delete this customer and ALL their data (orders, consultations, notes, care)? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="customerId" value={customerId} />
      <button className="btn sm" type="submit" style={{ color: "var(--danger)", borderColor: "var(--danger)", width: "100%" }}>
        Delete customer
      </button>
    </form>
  );
}
