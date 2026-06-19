import EmptyState from "@/app/_components/empty-state";

export default function BarcodePage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Barcode / GTIN</h1>
          <p>Manage the GTIN pool, issuers and assignment. Generate EAN and UPC labels.</p>
        </div>
      </div>
      <EmptyState
        title="No GTIN data loaded"
        hint="The GTIN pool appears here once the embedded Barcode Studio is wired to the existing gtin_pool data."
      />
    </>
  );
}
