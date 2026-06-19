// Order lifecycle derived from the existing customer_orders columns:
// Reserved -> Printed -> Fulfilled, plus Cancelled.

export type OrderStageRow = {
  status: string | null;
  printed_at: string | null;
  fulfilled_at: string | null;
};

export type Stage = { key: string; label: string; chip: string };

export function stageOf(o: OrderStageRow): Stage {
  if (o.status === "cancelled") return { key: "cancelled", label: "Cancelled", chip: "danger" };
  if (o.fulfilled_at) return { key: "fulfilled", label: "Fulfilled", chip: "ok" };
  if (o.printed_at) return { key: "printed", label: "Printed", chip: "info" };
  return { key: "reserved", label: "Reserved", chip: "warn" };
}
