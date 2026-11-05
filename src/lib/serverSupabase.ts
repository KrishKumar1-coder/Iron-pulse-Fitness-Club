import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export function getAdminAccessSecret(): string {
  return (process.env.ADMIN_ACCESS_SECRET || "").trim();
}

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://sldtibqmumlfupranpbr.supabase.co"
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZHRpYnFtdW1sZnVwcmFucGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNzc2NDEsImV4cCI6MjEwNjY1MzY0MX0.NL5o8tLKzw6uwcekNFWAf2cVv549aIJ24cEm4xT8Ozk"
  );
}

export interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export interface ServerClientResult {
  supabase: ReturnType<typeof createServerClient>;
  cookiesToSet: CookieToSet[];
  applyCookies: (response: NextResponse) => NextResponse;
}

/**
 * Creates a Supabase client configured for Next.js Route Handlers with cookie preservation.
 */
export function createRouteHandlerClient(request: NextRequest): ServerClientResult {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          cookiesToSet.push(cookie);
        });
      },
    },
  });

  const applyCookies = (response: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };

  return { supabase, cookiesToSet, applyCookies };
}

export interface AdminAuthResult {
  authorized: boolean;
  status?: number;
  error?: string;
  user?: { id: string; email: string };
  supabase?: ReturnType<typeof createServerClient>;
  applyCookies?: (response: NextResponse) => NextResponse;
}

/**
 * Verifies Supabase Auth session on incoming admin requests using getClaims() / getUser()
 * and enforces that the verified user matches the server-configured ADMIN_EMAIL.
 */
export async function verifyAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const expectedAdminEmail = getAdminEmail();

  // 1. Check Authorization Bearer header first (primary for modern SPA & client API calls)
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  let bearerToken: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }

  const { supabase: cookieSupabase, cookiesToSet, applyCookies } = createRouteHandlerClient(request);

  try {
    let verifiedEmail: string | undefined;
    let userId: string | undefined;
    let authenticatedClient = cookieSupabase;

    // Check Bearer Token if provided and valid format
    if (bearerToken && bearerToken !== "admin_verified") {
      try {
        const { data: userData, error: userError } = await cookieSupabase.auth.getUser(bearerToken);
        if (userData?.user && !userError) {
          verifiedEmail = userData.user.email;
          userId = userData.user.id;

          // Configure client with Bearer token header so all PostgREST queries pass RLS
          authenticatedClient = createServerClient(url, anonKey, {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookies) {
                cookies.forEach((cookie) => cookiesToSet.push(cookie));
              },
            },
            global: {
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
            },
          });
        }
      } catch (tokenErr) {
        console.warn("Bearer token validation error:", tokenErr);
      }
    }

    // 2. Fallback to session cookies if Bearer token wasn't provided or valid
    if (!verifiedEmail) {
      const { data: claimsData } = await cookieSupabase.auth.getClaims();
      verifiedEmail = claimsData?.claims?.email as string | undefined;
      userId = claimsData?.claims?.sub as string | undefined;

      if (!verifiedEmail) {
        const { data: userData, error: userError } = await cookieSupabase.auth.getUser();
        if (!userError && userData?.user) {
          verifiedEmail = userData.user.email;
          userId = userData.user.id;
        }
      }
    }

    if (!verifiedEmail || !userId) {
      return {
        authorized: false,
        status: 401,
        error: "Unauthenticated. Admin session is required.",
      };
    }

    // 3. Strict whitelist check against server-side ADMIN_EMAIL
    const cleanEmail = verifiedEmail.toLowerCase().trim();
    if (!expectedAdminEmail || cleanEmail !== expectedAdminEmail) {
      return {
        authorized: false,
        status: 403,
        error: `Forbidden. Email "${verifiedEmail}" is not authorized for administration.`,
      };
    }

    return {
      authorized: true,
      user: { id: userId, email: verifiedEmail },
      supabase: authenticatedClient,
      applyCookies,
    };
  } catch (err: any) {
    return {
      authorized: false,
      status: 500,
      error: err?.message || "Internal authorization verification error.",
    };
  }
}

/**
 * UUID v4 validator
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}
