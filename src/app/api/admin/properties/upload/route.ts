import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, getSupabaseUrl } from "@/lib/serverSupabase";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Validate MIME type
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported image format (${mimeType}). Allowed formats are JPG, PNG, WebP, AVIF, and GIF.`,
        },
        { status: 400 }
      );
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image file exceeds maximum allowable size of 10MB." },
        { status: 400 }
      );
    }

    const ext = EXTENSION_MAP[mimeType] || "jpg";
    const filename = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage bucket 'property-images'
    const { data, error } = await auth.supabase.storage
      .from("property-images")
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      return NextResponse.json(
        { error: `Storage upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const supabaseUrl = getSupabaseUrl();
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/property-images/${filename}`;

    const response = NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      mimeType,
    });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error during image upload." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminRequest(request);

  if (!auth.authorized || !auth.supabase) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized access." },
      { status: auth.status || 401 }
    );
  }

  try {
    const body = await request.json();
    let filename = body.filename;

    if (!filename && body.url) {
      // Extract filename from public URL
      const parts = String(body.url).split("/property-images/");
      if (parts.length > 1) {
        filename = parts[1].split("?")[0];
      }
    }

    if (!filename) {
      return NextResponse.json(
        { error: "Image filename or URL is required." },
        { status: 400 }
      );
    }

    // Delete from Supabase Storage bucket 'property-images'
    const { error } = await auth.supabase.storage
      .from("property-images")
      .remove([filename]);

    if (error) {
      console.error("Supabase Storage delete error:", error);
      return NextResponse.json(
        { error: `Storage delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true, filename });
    return auth.applyCookies ? auth.applyCookies(response) : response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error deleting image." },
      { status: 500 }
    );
  }
}
