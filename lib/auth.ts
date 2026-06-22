import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type StaffUser = {
  id: string;
  email: string | null;
  app_metadata: Record<string, unknown>;
};

/**
 * The authenticated staff user for the current request, verified LOCALLY from
 * the session JWT via getClaims().
 *
 * The project signs JWTs with asymmetric (ES256) keys, so this is a
 * cryptographic signature check against cached public keys — no network
 * round-trip to the Supabase auth server on each navigation. (The previous
 * getUser() made a ~300ms call to the auth server on every page, twice per
 * navigation once middleware is counted — the main source of the click lag.)
 *
 * Middleware keeps the session cookie fresh, so the token is valid here.
 * Wrapped in React cache() so repeated calls in one render share the result.
 */
export const getCurrentUser = cache(async (): Promise<StaffUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const c = data.claims;
  return {
    id: String(c.sub ?? ""),
    email: typeof c.email === "string" ? c.email : null,
    app_metadata: (c.app_metadata as Record<string, unknown>) ?? {},
  };
});
