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
    const { data, error } = await auth.supabase
      .from("properties")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json(data || []);
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error fetching properties." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      location,
      locationKey,
      type,
      price,
      priceValue,
      beds,
      baths,
      sqft,
      images,
      badge,
      status,
      description,
      dimensions,
      floorPlanUrl,
      virtualTourUrl,
      neighborhood,
    } = body;

    // Strict validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Property title is required." }, { status: 400 });
    }
    if (!location || typeof location !== "string" || !location.trim()) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }
    if (!type || typeof type !== "string" || !type.trim()) {
      return NextResponse.json({ error: "Property type is required." }, { status: 400 });
    }
    if (!price || typeof price !== "string" || !price.trim()) {
      return NextResponse.json({ error: "Price string is required." }, { status: 400 });
    }

    // Compute numeric price value if not provided
    let computedPriceValue = Number(priceValue);
    if (isNaN(computedPriceValue) || computedPriceValue <= 0) {
      const parsed = parseInt(price.replace(/[^0-9]/g, ""), 10);
      computedPriceValue = isNaN(parsed) ? 1000000 : parsed;
    }

    const propertyRow = {
      title: title.trim().slice(0, 250),
      location: location.trim().slice(0, 250),
      location_key: (locationKey || location).trim().slice(0, 250),
      type: type.trim().slice(0, 100),
      price: price.trim().slice(0, 100),
      price_value: computedPriceValue,
      beds: Math.max(0, parseInt(String(beds), 10) || 1),
      baths: Math.max(0, parseFloat(String(baths)) || 1),
      sqft: (sqft ? String(sqft).trim() : "5,000").slice(0, 50),
      images: Array.isArray(images) && images.length > 0 ? images : [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1080&q=75"
      ],
      badge: badge ? String(badge).trim().slice(0, 100) : "Exclusive",
      status: status === "For Rent" ? "For Rent" : "For Sale",
      description: description ? String(description).trim().slice(0, 5000) : "Exceptional luxury residence with bespoke architectural craftsmanship.",
      dimensions: Array.isArray(dimensions) ? dimensions : [],
      floor_plan_url: floorPlanUrl ? String(floorPlanUrl).trim() : "",
      virtual_tour_url: virtualTourUrl ? String(virtualTourUrl).trim() : "",
      neighborhood: neighborhood && typeof neighborhood === "object" ? neighborhood : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await auth.supabase
      .from("properties")
      .insert(propertyRow)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert property error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, property: data }, { status: 201 });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error creating property." },
      { status: 500 }
    );
  }
}
