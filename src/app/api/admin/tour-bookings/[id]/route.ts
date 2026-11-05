import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, isValidUUID } from "@/lib/serverSupabase";

const ALLOWED_TOUR_STATUSES = ["New Lead", "Confirmed", "Contacted", "Pending", "Completed", "Cancelled"] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { error: "Invalid or malformed booking ID format. Must be a valid UUID." },
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

    if (!status || !ALLOWED_TOUR_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Allowed values are: ${ALLOWED_TOUR_STATUSES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const rpcRes = await auth.supabase.rpc("update_tour_status", {
      tour_id: id,
      new_status: status,
    });

    if (rpcRes.error) {
      const { error } = await auth.supabase
        .from("tour_bookings")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json(
          { error: "Unable to update booking status." },
          { status: 500 }
        );
      }
    }

    const response = NextResponse.json({ success: true, id, status });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    console.error("Server error updating tour booking:", err);
    return NextResponse.json(
      { error: "Internal server error updating booking status." },
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
      { error: "Invalid or malformed booking ID format. Must be a valid UUID." },
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
    const rpcRes = await auth.supabase.rpc("delete_tour", {
      tour_id: id,
    });

    if (rpcRes.error) {
      const { error } = await auth.supabase
        .from("tour_bookings")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Supabase delete error:", error);
        return NextResponse.json(
          { error: "Unable to delete booking record." },
          { status: 500 }
        );
      }
    }

    const response = NextResponse.json({ success: true, id });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    console.error("Server error deleting tour booking:", err);
    return NextResponse.json(
      { error: "Internal server error deleting booking." },
      { status: 500 }
    );
  }
}
