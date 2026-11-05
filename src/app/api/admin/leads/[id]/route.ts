import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, isValidUUID } from "@/lib/serverSupabase";

const ALLOWED_LEAD_STATUSES = ["New Lead", "Confirmed", "Contacted", "New", "Tour Scheduled", "Closed"] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { error: "Invalid or malformed lead ID format. Must be a valid UUID." },
      { status: 400 }
    );
  }

  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !ALLOWED_LEAD_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Allowed values are: ${ALLOWED_LEAD_STATUSES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const rpcRes = await auth.supabase.rpc("update_lead_status", {
      lead_id: id,
      new_status: status,
    });

    if (rpcRes.error) {
      const { error } = await auth.supabase
        .from("leads")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json(
          { error: "Unable to update lead status." },
          { status: 500 }
        );
      }
    }

    const response = NextResponse.json({ success: true, id, status });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    console.error("Server error updating lead:", err);
    return NextResponse.json(
      { error: "Internal server error updating lead status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { error: "Invalid or malformed lead ID format. Must be a valid UUID." },
      { status: 400 }
    );
  }

  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    const rpcRes = await auth.supabase.rpc("delete_lead", {
      lead_id: id,
    });

    if (rpcRes.error) {
      const { error } = await auth.supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Supabase delete error:", error);
        return NextResponse.json(
          { error: "Unable to delete lead record." },
          { status: 500 }
        );
      }
    }

    const response = NextResponse.json({ success: true, id });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    console.error("Server error deleting lead:", err);
    return NextResponse.json(
      { error: "Internal server error deleting lead." },
      { status: 500 }
    );
  }
}
