import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/serverSupabase";

export async function POST(request: NextRequest) {
  try {
    const { supabase, applyCookies } = createRouteHandlerClient(request);

    // Signs out of Supabase Auth, clearing session tokens
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Explicitly delete all Supabase auth cookies and the admin gate token
    response.cookies.delete("aurelia_admin_gate");
    request.cookies.getAll().forEach((cookie) => {
      if (
        cookie.name.includes("sb-") ||
        cookie.name.includes("auth-token") ||
        cookie.name.includes("supabase") ||
        cookie.name.includes("session")
      ) {
        response.cookies.delete(cookie.name);
      }
    });

    return applyCookies(response);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to log out" },
      { status: 500 }
    );
  }
}
