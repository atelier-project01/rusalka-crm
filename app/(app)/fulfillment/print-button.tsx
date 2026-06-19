"use client";

export default function PrintButton() {
  return (
    <button className="btn sm" type="button" onClick={() => window.print()}>
      Print pack sheet
    </button>
  );
}
