import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient, getAdminEmail } from "@/lib/serverSupabase";
import { checkRateLimit, isHoneypotTriggered, EMAIL_REGEX } from "@/lib/formSecurity";

/**
 * Constant-time simulated delay to defeat timing attacks
 */
async function uniformTimingDelay(minMs = 350, jitterMs = 100): Promise<void> {
  const delay = minMs + Math.floor(Math.random() * jitterMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Abuse Protection: Rate Limiting (max 5 attempts per 2 minutes per IP)
    const rateCheck = checkRateLimit(request, 5, 2 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Too many attempts. Please try again later.",
          retryAfter: rateCheck.retryAfter || 60,
          locked: true
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfter || 60),
          },
        }
      );
    }

    // 2. Payload size protection (max 16KB)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 16 * 1024) {
      return NextResponse.json(
        { error: "Invalid payload." },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 400 }
      );
    }

    // 3. Automated Bot Detection: Honeypot check
    if (isHoneypotTriggered(body)) {
      await uniformTimingDelay(400, 100);
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const { email, password } = body;

    // 4. Server-Side Schema & Type Validation
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      email.length > 254 ||
      password.length > 256 ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      await uniformTimingDelay(300, 100);
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const adminEmail = getAdminEmail();
    const normalizedEmail = email.trim().toLowerCase();

    // 5. Account Enumeration Defense:
    // If email is not authorized, simulate bcrypt hashing time before returning 401
    if (normalizedEmail !== adminEmail) {
      await uniformTimingDelay(400, 150);
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // 6. Supabase Auth Verification (Uses secure bcrypt hashing internally)
    const { supabase, applyCookies } = createRouteHandlerClient(request);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      // Ensure constant response time on bad password
      const elapsed = Date.now() - startTime;
      if (elapsed < 450) {
        await new Promise((r) => setTimeout(r, 450 - elapsed));
      }
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Double check email identity against server configuration
    if (!data.user.email || data.user.email.toLowerCase().trim() !== adminEmail) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const sessionPayload = {
      access_token: data.session?.access_token || "",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };

    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: sessionPayload,
    });

    return applyCookies(response);
  } catch (err: any) {
    // Zero stack trace leakage to client: log on server only
    console.error("Admin authentication error occurred on server:", err?.message || err);
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 500 }
    );
  }
}
