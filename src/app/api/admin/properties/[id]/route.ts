import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/serverSupabase";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const propId = parseInt(id, 10);

  if (isNaN(propId) || propId <= 0) {
    return NextResponse.json({ error: "Invalid property ID format." }, { status: 400 });
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
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updatePayload.title = String(body.title).trim().slice(0, 250);
    if (body.location !== undefined) updatePayload.location = String(body.location).trim().slice(0, 250);
    if (body.locationKey !== undefined || body.location !== undefined) {
      updatePayload.location_key = String(body.locationKey || body.location).trim().slice(0, 250);
    }
    if (body.type !== undefined) updatePayload.type = String(body.type).trim().slice(0, 100);
    if (body.price !== undefined) {
      updatePayload.price = String(body.price).trim().slice(0, 100);
      if (body.priceValue === undefined) {
        const parsed = parseInt(String(body.price).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed) && parsed > 0) {
          updatePayload.price_value = parsed;
        }
      }
    }
    if (body.priceValue !== undefined) updatePayload.price_value = Number(body.priceValue);
    if (body.beds !== undefined) updatePayload.beds = Math.max(0, parseInt(String(body.beds), 10) || 0);
    if (body.baths !== undefined) updatePayload.baths = Math.max(0, parseFloat(String(body.baths)) || 0);
    if (body.sqft !== undefined) updatePayload.sqft = String(body.sqft).trim().slice(0, 50);
    if (Array.isArray(body.images)) updatePayload.images = body.images;
    if (body.badge !== undefined) updatePayload.badge = String(body.badge).trim().slice(0, 100);
    if (body.status !== undefined) updatePayload.status = body.status === "For Rent" ? "For Rent" : "For Sale";
    if (body.description !== undefined) updatePayload.description = String(body.description).trim().slice(0, 5000);
    if (Array.isArray(body.dimensions)) updatePayload.dimensions = body.dimensions;
    if (body.floorPlanUrl !== undefined) updatePayload.floor_plan_url = String(body.floorPlanUrl).trim();
    if (body.virtualTourUrl !== undefined) updatePayload.virtual_tour_url = String(body.virtualTourUrl).trim();
    if (body.neighborhood !== undefined) updatePayload.neighborhood = body.neighborhood;

    const { data, error } = await auth.supabase
      .from("properties")
      .update(updatePayload)
      .eq("id", propId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update property error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, property: data });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error updating property." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const propId = parseInt(id, 10);

  if (isNaN(propId) || propId <= 0) {
    return NextResponse.json({ error: "Invalid property ID format." }, { status: 400 });
  }

  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    const { error } = await auth.supabase
      .from("properties")
      .delete()
      .eq("id", propId);

    if (error) {
      console.error("Supabase delete property error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, id: propId });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error deleting property." },
      { status: 500 }
    );
  }
}
