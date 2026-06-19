"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--canvas)",
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        className="card"
        style={{ width: "100%", maxWidth: 380, padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 20 }}>
          <div
            className="mark"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontWeight: 700,
            }}
          >
            AR
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, color: "var(--text-strong)" }}>Atelier Rusalka</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
              CRM &amp; Operations Hub
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: "var(--fs-h1)", marginBottom: 4 }}>Staff sign in</h1>
        <p className="muted" style={{ fontSize: "var(--fs-sm)", marginBottom: 18 }}>
          Internal access only.
        </p>

        <label style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 6 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          style={inputStyle}
        />

        <label style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, margin: "14px 0 6px" }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "var(--fs-sm)", marginTop: 14 }}>{error}</p>
        )}

        <button
          type="submit"
          className="btn pri"
          disabled={busy || !email || !password}
          style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  fontSize: "var(--fs-sm)",
  fontFamily: "var(--font-body)",
  color: "var(--text-strong)",
  background: "var(--surface)",
  border: "1px solid var(--border-2)",
  borderRadius: "var(--btn-r)",
  outline: "none",
};
