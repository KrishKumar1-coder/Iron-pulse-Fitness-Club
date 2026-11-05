import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { 
  getAdminEmail, 
  getSupabaseAnonKey, 
  getSupabaseUrl 
} from "@/lib/serverSupabase";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Calling getUser refreshes expired auth cookies automatically
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const expectedAdminEmail = getAdminEmail();
  const isAuthenticatedAdmin = Boolean(
    user &&
    user.email &&
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

  // Route: /login shortcut -> redirect to /admin/login
  if (pathname === "/login") {
    return createRedirectResponse("/admin/login");
  }

  // Route: /admin/login
  if (pathname === "/admin/login") {
    if (isAuthenticatedAdmin) {
      return createRedirectResponse("/admin");
    }
    return response;
  }

  // Route: /admin dashboard and protected subpaths
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticatedAdmin) {
      return createRedirectResponse("/admin/login");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
