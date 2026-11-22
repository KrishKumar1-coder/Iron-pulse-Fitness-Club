import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { 
  getAdminEmail, 
  getSupabaseAnonKey, 
  getSupabaseUrl 
} from "@/lib/serverSupabase";

/**
 * Checks if request contains Supabase authentication cookies.
 * Prevents redundant remote network calls for visitors with no session.
 */
function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && (c.name.includes("auth-token") || c.name.includes("token"))
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Instant bypass for all public pages (homepage, properties, location, static assets)
  // Never invoke remote auth checks on public pages to prevent mobile timeout issues.
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginShortcut = pathname === "/login";

  if (!isAdminRoute && !isLoginShortcut) {
    return NextResponse.next();
  }

  // 2. Shortcut: /login -> /admin/login
  if (isLoginShortcut) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 3. Fast Path for unauthenticated visitors:
  // If no Supabase auth cookies exist, avoid making any remote network calls.
  const hasAuth = hasSupabaseAuthCookies(request);

  if (!hasAuth) {
    if (pathname === "/admin/login") {
      // Allow visitor to view the login form immediately
      return NextResponse.next();
    }
    // Protect /admin and /admin/*: immediately redirect unauthenticated visitor to login
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 4. Handle authenticated /admin routes with Supabase session validation
  let response = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return pathname === "/admin/login" 
      ? response 
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Strict 2.5-second timeout on remote getUser() call to prevent Vercel Edge invocation timeout
  let user: any = null;
  try {
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth check timed out")), 2500)
    );
    const result = await Promise.race([authPromise, timeoutPromise]);
    user = result?.data?.user || null;
  } catch (err) {
    // If Supabase stalls or fails on poor mobile network, fail closed safely without crashing
    user = null;
  }

  const expectedAdminEmail = getAdminEmail();
  const isAuthenticatedAdmin = Boolean(
    user &&
    user.email &&
    expectedAdminEmail &&
    user.email.toLowerCase().trim() === expectedAdminEmail
  );

  const createRedirectResponse = (targetPath: string) => {
    const redirectUrl = new URL(targetPath, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return redirectResponse;
  };

  // Route: /admin/login - If already logged in as admin, redirect to /admin dashboard
  if (pathname === "/admin/login") {
    if (isAuthenticatedAdmin) {
      return createRedirectResponse("/admin");
    }
    return response;
  }

  // Route: /admin and subpaths - If not authenticated admin, force login redirect
  if (isAdminRoute && !isAuthenticatedAdmin) {
    return createRedirectResponse("/admin/login");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/login",
  ],
};
