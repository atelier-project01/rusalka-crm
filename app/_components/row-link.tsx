"use client";

import { useRouter } from "next/navigation";

/**
 * A table row that navigates to `href` when clicked anywhere — not just a link
 * cell. Keyboard-accessible (Enter/Space) and prefetches the destination on
 * hover so the detail page opens faster. Use for list rows that open a detail
 * page.
 */
export default function RowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      className="rowsel"
      onClick={() => router.push(href)}
      onMouseEnter={() => router.prefetch(href)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(href); } }}
      tabIndex={0}
    >
      {children}
    </tr>
  );
}
