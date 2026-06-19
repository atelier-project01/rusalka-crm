import EmptyState from "@/app/_components/empty-state";

export default function MarketingPage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Marketing Campaigns</h1>
          <p>Build segments from CRM data and send consent-aware campaigns.</p>
        </div>
      </div>
      <EmptyState
        title="No segments or campaigns yet"
        hint="The segment builder and campaign list appear here once the segments and campaigns tables are created."
      />
    </>
  );
}
