import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { moduleFromPath, roleFromUser, canAccess } from "@/lib/roles";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the staff Supabase session on every request, and enforces per-role
 * module access: an authenticated staff member who opens a module their role
 * can't access is redirected to the dashboard.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Per-role module gating (authenticated users only; the (app) layout handles
  // redirecting unauthenticated visitors to /login).
  const requestedModule = moduleFromPath(request.nextUrl.pathname);
  if (user && requestedModule && !canAccess(roleFromUser(user), requestedModule)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
