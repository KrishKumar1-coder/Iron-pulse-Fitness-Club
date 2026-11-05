import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/serverSupabase";
import {
  checkRateLimit,
  isHoneypotTriggered,
  validateTourSubmission,
} from "@/lib/formSecurity";

export async function POST(request: NextRequest) {
  try {
    // 1. Abuse Protection: Rate Limiting (max 10 submissions per minute per IP)
    const rateCheck = checkRateLimit(request, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many submission attempts. Please wait a moment before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfter || 60),
          },
        }
      );
    }

    // 2. Payload size protection (max 32KB)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 32 * 1024) {
      return NextResponse.json(
        { error: "Payload too large. Submission exceeds maximum allowable size." },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed request. Expected valid JSON." },
        { status: 400 }
      );
    }

    // 3. Bot Abuse Protection: Honeypot Detection
    if (isHoneypotTriggered(body)) {
      return NextResponse.json(
        { error: "Automated submission rejected." },
        { status: 400 }
      );
    }

    // 4. Server-Side Schema & Field Validation
    const { error: validationError, tour: sanitizedTour } = validateTourSubmission(body);
    if (validationError || !sanitizedTour) {
      return NextResponse.json(
        { error: validationError || "Validation error." },
        { status: 400 }
      );
    }

    // 5. Database Insertion with SSR Route Handler Client
    const { supabase, applyCookies } = createRouteHandlerClient(request);

    const { error: dbError } = await supabase
      .from("tour_bookings")
      .insert(sanitizedTour);

    if (dbError) {
      console.error("Supabase insert tour error:", dbError);
      return NextResponse.json(
        { error: "Unable to process tour request. Please try again later." },
        { status: 500 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: "Tour request submitted successfully." },
      { status: 201 }
    );
    return applyCookies(response);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error processing tour request." },
      { status: 500 }
    );
  }
}

// Disallow unauthenticated public reads, updates, or deletes
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. Public reading of appointments is prohibited." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method Not Allowed." },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method Not Allowed. Public updates are prohibited." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed. Public deletions are prohibited." },
    { status: 405 }
  );
}
