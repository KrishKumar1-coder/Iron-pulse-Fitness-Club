import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/serverSupabase";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    user: auth.user,
  });

  return auth.applyCookies ? auth.applyCookies(response) : response;
}
