import { NextRequest, NextResponse } from "next/server";
import { properties as fallbackProperties, Property } from "@/data/properties";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/serverSupabase";
import { createClient } from "@supabase/supabase-js";

function mapDbRowToProperty(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    locationKey: row.location_key || row.location,
    type: row.type,
    price: row.price,
    priceValue: Number(row.price_value) || 0,
    beds: Number(row.beds) || 0,
    baths: Number(row.baths) || 0,
    sqft: String(row.sqft || ""),
    images: Array.isArray(row.images) ? row.images : [],
    badge: row.badge || "",
    status: row.status || "For Sale",
    description: row.description || "",
    dimensions: Array.isArray(row.dimensions) ? row.dimensions : [],
    floorPlanUrl: row.floor_plan_url || "",
    virtualTourUrl: row.virtual_tour_url || "",
    neighborhood: row.neighborhood || undefined,
  };
}

let publicClient: ReturnType<typeof createClient> | null = null;
const singlePropertyCache = new Map<number, { data: Property; timestamp: number }>();
const CACHE_TTL_MS = 30_000;

function getPublicSupabaseClient() {
  if (!publicClient) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    publicClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return publicClient;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const propId = parseInt(id, 10);

  if (isNaN(propId) || propId <= 0) {
    return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
  }

  // Fast cache hit
  const cached = singlePropertyCache.get(propId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    const client = getPublicSupabaseClient();

    const queryPromise = client
      .from("properties")
      .select("*")
      .eq("id", propId)
      .single();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
      setTimeout(() => resolve({ data: null, error: new Error("Supabase query timeout (2.5s)") }), 2500);
    });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error || !data) {
      const fallback = fallbackProperties.find((p) => p.id === propId);
      if (fallback) {
        return NextResponse.json(fallback, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        });
      }
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const mapped = mapDbRowToProperty(data);
    singlePropertyCache.set(propId, { data: mapped, timestamp: Date.now() });

    return NextResponse.json(mapped, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/properties/[id]:", err);
    const fallback = fallbackProperties.find((p) => p.id === propId);
    if (fallback) {
      return NextResponse.json(fallback, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
}
