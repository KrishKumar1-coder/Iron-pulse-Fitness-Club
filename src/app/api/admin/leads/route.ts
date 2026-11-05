import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/serverSupabase";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    let leadsData = null;
    const rpcRes = await auth.supabase.rpc("get_admin_leads");
    if (!rpcRes.error && Array.isArray(rpcRes.data)) {
      leadsData = rpcRes.data;
    } else {
      const { data, error } = await auth.supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        return NextResponse.json(
          { error: "Failed to retrieve leads. Please try again later." },
          { status: 500 }
        );
      }
      leadsData = data;
    }

    const response = NextResponse.json(leadsData || []);
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    console.error("Server error in GET /api/admin/leads:", err);
    return NextResponse.json(
      { error: "Internal server error fetching leads." },
      { status: 500 }
    );
  }
}
