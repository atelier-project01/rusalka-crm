"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ModuleKey, Role } from "@/lib/roles";

type ModuleDef = {
  key: ModuleKey;
  href: string;
  label: string;
  section: string;
  icon: React.ReactNode;
};

const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Overview Dashboard",
    section: "Overview",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
    ),
  },
  {
    key: "customers",
    href: "/customers",
    label: "Customer 360",
    section: "Customer 360",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
    ),
  },
  {
    key: "marketing",
    href: "/marketing",
    label: "Marketing Campaigns",
    section: "Marketing Campaigns",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11 21 3l-8 18-2-7-8-3Z" /></svg>
    ),
  },
  {
    key: "fulfillment",
    href: "/fulfillment",
    label: "Fulfillment",
    section: "Fulfillment",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h13v10H3z" /><path d="M16 10h3l2 2v5h-5" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>
    ),
  },
  {
    key: "barcode",
    href: "/barcode",
    label: "Barcode / GTIN",
    section: "Barcode / GTIN",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 5v14M7 5v14M10 5v14M13 5v14M16 5v14M19 5v14" /></svg>
    ),
  },
  {
    key: "care",
    href: "/care",
    label: "Customer Care",
    section: "Customer Care",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>
    ),
  },
];

export default function Shell({
  children,
  userEmail,
  role,
  allowed,
}: {
  children: React.ReactNode;
  userEmail: string;
  role: Role;
  allowed: ModuleKey[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const visibleModules = MODULES.filter((m) => allowed.includes(m.key));
  const active = MODULES.find((m) => pathname.startsWith(m.href)) ?? visibleModules[0] ?? MODULES[0];

  const initials = userEmail.replace(/@.*/, "").slice(0, 2).toUpperCase() || "··";

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="hamburger" aria-label="Toggle navigation" onClick={() => setNavOpen((v) => !v)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <div className="brand">
          <div className="mark">AR</div>
          <div className="wm"><b>Atelier Rusalka</b><span>CRM &amp; Operations Hub</span></div>
        </div>
        <div className="search">
          <span className="si"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-3.6-3.6" /></svg></span>
          <input type="text" placeholder="Search customers, orders, GTINs, care items" />
          <span className="kbd">⌘K</span>
        </div>
        <div className="top-right">
          <button className="iconbtn hide-sm" title="Help"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3" /><circle cx="12" cy="16.5" r=".6" fill="currentColor" /></svg></button>
          <button className="iconbtn" title="Notifications"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg></button>
          <div className="usermenu" title={userEmail}>
            <div className="avatar">{initials}</div>
            <div className="who"><b>{userEmail.replace(/@.*/, "")}</b><span>Staff</span></div>
          </div>
          <button className="iconbtn" title="Sign out" onClick={signOut} disabled={signingOut} aria-label="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
          </button>
        </div>
      </header>

      <div className="body">
        <div className={`scrim${navOpen ? " show" : ""}`} onClick={() => setNavOpen(false)} />
        <nav className={`nav${navOpen ? " open" : ""}`}>
          <div className="seclabel">Modules</div>
          {visibleModules.map((m) => {
            const on = pathname.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`navitem${on ? " on" : ""}`}
                title={m.label}
                onClick={() => setNavOpen(false)}
              >
                <span className="ni">{m.icon}</span>
                <span className="navlabel">{m.label}</span>
              </Link>
            );
          })}
          <div className="navfoot">
            <b>Role: {role}</b><br />
            Navigation is gated by role. Sensitive actions write to the audit log.
          </div>
        </nav>

        <main className="main">
          <div className="subbar">
            <div className="crumbs">
              <span className="hidesm">Hub</span>
              <span className="sep hidesm">/</span>
              <b>{active.section}</b>
            </div>
            <span style={{ flex: "1 1 auto" }} />
            <span className="envpill"><span className="cdot" />Test environment</span>
          </div>
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  );
}
