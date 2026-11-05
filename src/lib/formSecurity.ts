import { NextRequest } from "next/server";

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const PHONE_REGEX = /^[+0-9\s().-]{6,50}$/;

const HONEYPOT_FIELDS = [
  "website",
  "company_url",
  "fax",
  "hp_field",
  "url_link",
  "_gotcha",
] as const;

// In-memory rate limiting map: ip -> { count, resetTime }
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const globalWithRateLimit = globalThis as unknown as {
  __rateLimitMap?: Map<string, RateLimitEntry>;
};

const rateLimitMap =
  globalWithRateLimit.__rateLimitMap || new Map<string, RateLimitEntry>();
globalWithRateLimit.__rateLimitMap = rateLimitMap;

// Periodic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
  // Ensure the timer doesn't keep node alive during test runs
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Extracts client IP from request headers
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

/**
 * Rate limiting check (defaults to 10 submissions per 60 seconds per IP)
 */
export function checkRateLimit(
  request: NextRequest,
  maxRequests = 10,
  windowMs = 60 * 1000
): { allowed: boolean; retryAfter?: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Checks if any honeypot spam traps were filled
 */
export function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  for (const field of HONEYPOT_FIELDS) {
    const val = body[field];
    if (typeof val === "string" && val.trim().length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Strips dangerous or non-printable control characters
 */
function sanitizeString(input: unknown, maxLength: number): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove control chars
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

export interface SanitizedLead {
  client_name: string;
  email: string;
  phone: string | null;
  property_id: number | null;
  property_title: string | null;
  property_location: string | null;
  property_price: string | null;
  interest_type: string;
  notes: string | null;
  status: "New Lead";
}

export interface SanitizedTour {
  client_name: string;
  email: string;
  phone: string | null;
  preferred_date: string;
  preferred_time: string;
  property_title: string;
  special_requests: string | null;
  status: "New Lead";
}

/**
 * Validates and sanitizes a public lead submission
 */
export function validateLeadSubmission(body: any): {
  error?: string;
  lead?: SanitizedLead;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request payload. Expected a JSON object." };
  }

  // 1. Validate Client Name (required, 2-200 chars)
  const client_name = sanitizeString(body.client_name, 200);
  if (!client_name || client_name.length < 2) {
    return { error: "Full name is required (minimum 2 characters)." };
  }

  // 2. Validate Email (required, valid format, max 200 chars)
  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "A valid email address is required." };
  }
  const email = body.email.trim().toLowerCase().slice(0, 200);
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Invalid email format. Please provide a valid email address." };
  }

  // 3. Validate Phone (optional, max 50 chars, valid phone chars)
  let phone: string | null = null;
  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    const rawPhone = String(body.phone).trim();
    if (rawPhone) {
      if (rawPhone.length > 50 || !PHONE_REGEX.test(rawPhone)) {
        return { error: "Invalid phone number format." };
      }
      phone = rawPhone;
    }
  }

  // 4. Validate Property ID (optional positive integer)
  let property_id: number | null = null;
  if (body.property_id !== undefined && body.property_id !== null && body.property_id !== "") {
    const pid = Number(body.property_id);
    if (!Number.isInteger(pid) || pid <= 0) {
      return { error: "Property ID must be a positive integer." };
    }
    property_id = pid;
  }

  // 5. Sanitize text fields
  const property_title = sanitizeString(body.property_title, 250);
  const property_location = sanitizeString(body.property_location, 250);
  const property_price = sanitizeString(body.property_price, 100);
  const interest_type = sanitizeString(body.interest_type, 250) || "VIP Inquiry";
  const notes = sanitizeString(body.notes, 2000);

  return {
    lead: {
      client_name,
      email,
      phone,
      property_id,
      property_title,
      property_location,
      property_price,
      interest_type,
      notes,
      status: "New Lead", // Strictly locked server-side
    },
  };
}

/**
 * Validates and sanitizes a public tour booking submission
 */
export function validateTourSubmission(body: any): {
  error?: string;
  tour?: SanitizedTour;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request payload. Expected a JSON object." };
  }

  // 1. Validate Client Name (required, 2-200 chars)
  const client_name = sanitizeString(body.client_name, 200);
  if (!client_name || client_name.length < 2) {
    return { error: "Full name is required (minimum 2 characters)." };
  }

  // 2. Validate Email (required, valid format, max 200 chars)
  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "A valid email address is required." };
  }
  const email = body.email.trim().toLowerCase().slice(0, 200);
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Invalid email format. Please provide a valid email address." };
  }

  // 3. Validate Phone (optional, max 50 chars, valid phone chars)
  let phone: string | null = null;
  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    const rawPhone = String(body.phone).trim();
    if (rawPhone) {
      if (rawPhone.length > 50 || !PHONE_REGEX.test(rawPhone)) {
        return { error: "Invalid phone number format." };
      }
      phone = rawPhone;
    }
  }

  // 4. Sanitize appointment fields
  const preferred_date = sanitizeString(body.preferred_date, 100) || "Earliest Available";
  const preferred_time = sanitizeString(body.preferred_time, 100) || "Business Hours";
  const property_title = sanitizeString(body.property_title, 250) || "General Portfolio";
  const special_requests = sanitizeString(body.special_requests, 2000);

  return {
    tour: {
      client_name,
      email,
      phone,
      preferred_date,
      preferred_time,
      property_title,
      special_requests,
      status: "New Lead", // Strictly locked server-side
    },
  };
}
