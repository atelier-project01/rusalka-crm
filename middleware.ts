import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { moduleFromPath, roleFromUser, canAccess } from "@/lib/roles";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Verifies the staff session and enforces per-role module access on every
 * request.
 *
 * The session JWT is verified LOCALLY via getClaims() (asymmetric ES256 keys →
 * no network call) on the hot path. Only when the access token is missing or
 * expired do we hit the network with getUser(), which refreshes it via the
 * refresh token and rewrites the session cookies. This keeps navigation fast
 * (no per-click round-trip to the auth server) while still rotating tokens
 * before they expire.
 *
 * An authenticated staff member who opens a module their role can't access is
 * redirected to the dashboard. Unauthenticated visitors are sent to /login by
 * the (app) layout.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Local verification first (no network). Fall back to a network refresh only
  // when the token is missing or expired.
  let appMetadata: Record<string, unknown> | null = null;

  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims) {
    appMetadata = (claimsData.claims.app_metadata as Record<string, unknown>) ?? {};
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      appMetadata = user.app_metadata ?? {};
    }
  }

  // Per-role module gating (authenticated users only).
  const requestedModule = moduleFromPath(request.nextUrl.pathname);
  if (
    appMetadata &&
    requestedModule &&
    !canAccess(roleFromUser({ app_metadata: appMetadata }), requestedModule)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
