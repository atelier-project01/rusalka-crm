"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

/**
 * Renders a GTIN as a scannable barcode (client-side, via jsbarcode). Falls
 * back to a note if the value isn't valid for the chosen symbology.
 */
export default function BarcodeImage({ value, format }: { value: string; format: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    setErr(false);
    try {
      JsBarcode(ref.current, value, {
        format,
        displayValue: false,
        height: 56,
        width: 2,
        margin: 6,
        background: "transparent",
        valid: (ok: boolean) => { if (!ok) setErr(true); },
      });
    } catch {
      setErr(true);
    }
  }, [value, format]);

  return (
    <div>
      <svg ref={ref} style={{ maxWidth: "100%", display: err ? "none" : "block" }} />
      {err ? <div className="muted" style={{ fontSize: "var(--fs-xs)" }}>This GTIN isn&apos;t valid for {format}.</div> : null}
    </div>
  );
}
