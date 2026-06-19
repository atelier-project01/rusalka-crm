"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ModuleKey, Role } from "@/lib/roles";
import {
  LayoutDashboard,
  UserRound,
  Truck,
  ScanBarcode,
  Headset,
  Search,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  BookOpen,
} from "lucide-react";

type ModuleDef = {
  key: ModuleKey;
  href: string;
  label: string;
  section: string;
  icon: React.ReactNode;
};

const MODULES: ModuleDef[] = [
  { key: "dashboard", href: "/dashboard", label: "Overview Dashboard", section: "Overview", icon: <LayoutDashboard size={18} /> },
  { key: "customers", href: "/customers", label: "Customer 360", section: "Customer 360", icon: <UserRound size={18} /> },
  { key: "fulfillment", href: "/fulfillment", label: "Fulfillment", section: "Fulfillment", icon: <Truck size={18} /> },
  { key: "barcode", href: "/barcode", label: "Barcode / GTIN", section: "Barcode / GTIN", icon: <ScanBarcode size={18} /> },
  { key: "care", href: "/care", label: "Customer Care", section: "Customer Care", icon: <Headset size={18} /> },
  { key: "knowledge", href: "/knowledge", label: "Knowledge Base", section: "Knowledge Base", icon: <BookOpen size={18} /> },
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
          <Menu size={20} />
        </button>
        <div className="brand">
          <div className="mark">AR</div>
          <div className="wm"><b>Atelier Rusalka</b><span>CRM &amp; Operations Hub</span></div>
        </div>
        <div className="search">
          <span className="si"><Search size={15} /></span>
          <input type="text" placeholder="Search customers, orders, GTINs, care items" />
          <span className="kbd">⌘K</span>
        </div>
        <div className="top-right">
          <button className="iconbtn hide-sm" title="Help"><HelpCircle size={18} /></button>
          <button className="iconbtn" title="Notifications"><Bell size={18} /></button>
          <div className="usermenu" title={userEmail}>
            <div className="avatar">{initials}</div>
            <div className="who"><b>{userEmail.replace(/@.*/, "")}</b><span>Staff</span></div>
          </div>
          <button className="iconbtn" title="Sign out" onClick={signOut} disabled={signingOut} aria-label="Sign out">
            <LogOut size={18} />
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
