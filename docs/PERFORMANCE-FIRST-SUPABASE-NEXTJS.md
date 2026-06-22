# Performance-First Next.js + Supabase Setup (Snappy / Instant-UX Playbook)

> The patterns that make a Next.js (App Router) + Supabase app feel **instant**
> instead of laggy. The default Supabase/Next docs optimize for correctness and
> teachability, not perceived latency — this is the opposite trade-off, tuned
> for snappy internal tools. Apply these from the START of a new app, not after
> you notice the lag.
>
> Umbrella term for this whole approach: **perceived-performance (instant-UX)
> architecture.**

---

## The one-liner to request this on a new app

> "Build it performance-first / snappy: local JWT verification (`getClaims`, not
> `getUser` per request), parallel data fetching (no waterfalls), client-side
> state for list/detail selection, `loading.tsx` skeletons with Suspense
> streaming, link prefetch on hover, and co-locate the Vercel region with the
> Supabase region."

---

## The techniques (and their real names)

| Symptom of the slow default | Technique to ask for | What it does |
|---|---|---|
| ~300ms–1s lag per navigation | **Local JWT verification** (stateless auth) | Verify the session token locally with `getClaims()` + asymmetric keys, instead of a `getUser()` network call to the auth server on every page/middleware hit |
| Page slow even with little data | **Parallel data fetching** (kill **request waterfalls**) | Run independent queries in one `Promise.all`, never sequential `await`s |
| ~1–2s freeze when selecting a row | **Client-side state / optimistic UI** | Hold selection in React state; only fetch from the server when the data genuinely isn't already loaded |
| Blank/frozen screen during loads | **Streaming SSR with Suspense** / **skeleton screens** | `loading.tsx` shows an instant skeleton while data streams in |
| Slow to open a detail page | **Link prefetching** | Prefetch the destination on hover so it's in flight before the click |
| Everything slow regardless | **Region co-location** | Put the Vercel function in the same region as the Supabase DB |
| Revisiting a page refetches | **Stale-while-revalidate (SWR)** | Cache on the client so revisits are instant |

---

## Concrete patterns

### 1. Auth — verify the JWT locally (no per-request network call)
Requires Supabase **asymmetric (ES256) signing keys** — check
`{SUPABASE_URL}/auth/v1/.well-known/jwks.json` returns keys.

```ts
// lib/auth.ts — cached, local verification (no network round-trip)
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(); // local ES256 verify, JWKS cached
  return data?.claims ?? null;                       // claims: sub, email, app_metadata, ...
});
```

Middleware: verify locally first, only hit the network to **refresh** when the
token is missing/expired:

```ts
const { data } = await supabase.auth.getClaims();   // local, fast
if (!data?.claims) { await supabase.auth.getUser(); } // network refresh only when needed
```

> Why the default is slow: `getUser()` validates against the auth server every
> call (~300ms), and the standard SSR pattern calls it in middleware AND every
> page — 2+ network round-trips per navigation.

### 2. Data — one parallel batch, no waterfalls
```ts
// Slow: 3 sequential round-trips
const customer = await db.from("customers")...;
await logAudit(...);
const [orders, quizzes] = await Promise.all([...]);

// Fast: one parallel round-trip (independent queries + side-effects together)
const [{ data: customer }, { data: orders }, { data: quizzes }] = await Promise.all([
  db.from("customers")...,
  db.from("customer_orders")...,
  db.from("quiz_results")...,
  logAudit(...),
]);
```

### 3. Master-detail lists — select in client state, not the URL
Don't navigate (`?sel=<id>`) to highlight a row — that's a full server round-trip.
Fetch the list once (server), then hold selection in client state:

```tsx
"use client";
const [selId, setSelId] = useState(rows[0]?.id ?? null);
const selected = rows.find(r => r.id === selId) ?? rows[0];
// <tr onClick={() => setSelId(r.id)} tabIndex={0} onKeyDown={...}>  // whole row, instant
```
Keep an optional initial `?sel=` (read server-side, passed as `initialSelId`)
**only** for cross-page deep-links — in-page clicks never touch the server.

### 4. Rows — whole row clickable + hover prefetch
```tsx
"use client";
import { useRouter } from "next/navigation";
export default function RowLink({ href, children }) {
  const router = useRouter();
  return (
    <tr onClick={() => router.push(href)}
        onMouseEnter={() => router.prefetch(href)}   // prefetch before the click
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(href); } }}
        tabIndex={0}>
      {children}
    </tr>
  );
}
```

### 5. Loading — instant skeleton for any route that fetches
Add a `loading.tsx` next to the page. The shell stays; the content area shows a
skeleton immediately while the page's data loads. Essential for detail pages
whose data can't be preloaded.

---

## Checklist for a new app
- [ ] Supabase project uses asymmetric (ES256) signing keys → `getClaims()` is local
- [ ] One cached `getCurrentUser()` helper using `getClaims()`; no `getUser()` on the hot path
- [ ] Middleware verifies locally, refreshes only on expiry
- [ ] Every multi-query page uses `Promise.all` (no sequential awaits)
- [ ] Master-detail selection is client state; whole rows clickable + keyboard
- [ ] `loading.tsx` skeleton on every data-fetching route
- [ ] List rows prefetch the detail route on hover
- [ ] Vercel function region == Supabase DB region

## Testing note
Judge speed in a **production build** (`npm run build && npm start`) — `next dev`
is always laggy from on-demand route compilation and limited prefetch. Locally,
remaining latency is mostly your machine's distance to the DB region; in
production with co-located regions it drops to tens of ms.

---

*Reference implementation: this CRM (auth in `lib/auth.ts` + `middleware.ts`,
client-state lists in `app/(app)/*/`-`*-client.tsx`, `app/_components/row-link.tsx`,
`loading.tsx` files). Reusable across any Next.js + Supabase app.*
