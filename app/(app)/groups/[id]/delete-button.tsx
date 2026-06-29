"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSegment } from "../actions";

export default function DeleteGroupButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn sm"
      style={{ color: "#b4493f" }}
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this group? Customers are not affected.")) return;
        setBusy(true);
        const res = await deleteSegment(id);
        if (res.error) { alert(res.error); setBusy(false); return; }
        router.push("/groups");
      }}
    >
      Delete group
    </button>
  );
}
