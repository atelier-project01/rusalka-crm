import Builder from "../builder";

export const dynamic = "force-dynamic";

export default function NewGroupPage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>New group</h1>
          <p>Add filters and watch the live count update. Save it as a living group that keeps itself current.</p>
        </div>
      </div>
      <Builder />
    </>
  );
}
