import { NextResponse } from "next/server";
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

// Module-level singleton client and memory cache to eliminate connection churn & freeze delays
let publicClient: ReturnType<typeof createClient> | null = null;
let memoryCachedProperties: Property[] | null = null;
let lastCacheTimestamp = 0;
const MEMORY_CACHE_TTL_MS = 30_000; // 30 seconds

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

export async function GET() {
  const now = Date.now();

  // Instant in-memory cache hit (< 1ms response time)
  if (memoryCachedProperties && now - lastCacheTimestamp < MEMORY_CACHE_TTL_MS) {
    return NextResponse.json(memoryCachedProperties, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    const client = getPublicSupabaseClient();

    // Enforce strict 2.5s timeout so page reload never hangs if Supabase is cold or unresponsive
    const queryPromise = client
      .from("properties")
      .select("*")
      .order("id", { ascending: true });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
      setTimeout(() => resolve({ data: null, error: new Error("Supabase query timeout (2.5s)") }), 2500);
    });

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn("Supabase fetch warning, serving cached/fallback properties:", error.message);
      }
      const result = memoryCachedProperties || fallbackProperties;
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const mappedProperties: Property[] = data.map(mapDbRowToProperty);
    memoryCachedProperties = mappedProperties;
    lastCacheTimestamp = Date.now();

    return NextResponse.json(mappedProperties, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/properties:", err);
    const result = memoryCachedProperties || fallbackProperties;
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }
}
