import { getSegmentConfig } from "./actions";
import SegmentConfigEditor from "./editor";
import { getCurrentUser } from "@/lib/auth";
import { roleFromUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getSegmentConfig();
  const canEdit = roleFromUser(await getCurrentUser()) === "admin";

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Settings</h1>
          <p>Define the values that appear in the Customer Groups filters. Changes apply immediately — no deploy needed.</p>
        </div>
      </div>
      <SegmentConfigEditor config={config} canEdit={canEdit} />
    </>
  );
}
