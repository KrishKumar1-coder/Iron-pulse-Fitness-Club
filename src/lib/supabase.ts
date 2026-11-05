// Supabase Client and Authentication Service
import type { Property } from "@/data/properties";
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sldtibqmumlfupranpbr.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZHRpYnFtdW1sZnVwcmFucGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNzc2NDEsImV4cCI6MjEwNjY1MzY0MX0.NL5o8tLKzw6uwcekNFWAf2cVv549aIJ24cEm4xT8Ozk";

export interface SupabaseUser {
  id: string;
  email: string;
  role?: string;
}

export interface SupabaseSession {
  access_token: string;
  user: SupabaseUser;
}

export interface Lead {
  id: string;
  created_at: string;
  client_name: string;
  email: string;
  phone?: string;
  property_id?: number;
  property_title?: string;
  property_location?: string;
  property_price?: string;
  interest_type?: string;
  status: "New Lead" | "Confirmed" | "Contacted" | string;
  notes?: string;
}

export interface TourBooking {
  id: string;
  created_at: string;
  client_name: string;
  email: string;
  phone?: string;
  preferred_date?: string;
  preferred_time?: string;
  property_title?: string;
  special_requests?: string;
  status: "New Lead" | "Confirmed" | "Contacted" | string;
}

// Helper to extract cached admin access token for Bearer authentication
function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    try {
      const item = localStorage.getItem("aurelia_admin_session");
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed?.access_token && parsed.access_token !== "admin_verified") {
          headers["Authorization"] = `Bearer ${parsed.access_token}`;
        }
      }
    } catch {
      // ignore parsing error
    }
  }
  return headers;
}

// Client Wrapper communicating with secure server-side API routes & cookie auth
export const supabase = {
  auth: {
    async signInWithPassword(
      email: string,
      password: string
    ): Promise<{ data: { session: SupabaseSession | null }; error: Error | null }> {
      try {
        const normalizedEmail = email.toLowerCase().trim();

        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          const err: any = new Error(
            json.error || "Authentication failed. Please check credentials."
          );
          err.status = res.status;
          err.retryAfter = json.retryAfter || (res.headers.get("Retry-After") ? parseInt(res.headers.get("Retry-After")!, 10) : undefined);
          return {
            data: { session: null },
            error: err,
          };
        }

        const session: SupabaseSession = json.session || {
          access_token: "",
          user: json.user,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("aurelia_admin_session", JSON.stringify(session));
        }

        return { data: { session }, error: null };
      } catch (err: any) {
        return {
          data: { session: null },
          error: new Error(err.message || "Network error occurred during login"),
        };
      }
    },

    async getSession(): Promise<SupabaseSession | null> {
      try {
        const headers = getAdminAuthHeaders();
        const res = await fetch("/api/admin/session", {
          method: "GET",
          headers,
          credentials: "include",
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.authenticated && json.user) {
            let token = "";
            if (typeof window !== "undefined") {
              try {
                const item = localStorage.getItem("aurelia_admin_session");
                if (item) {
                  const parsed = JSON.parse(item);
                  if (parsed?.access_token && parsed.access_token !== "admin_verified") {
                    token = parsed.access_token;
                  }
                }
              } catch {}
            }
            const validSession: SupabaseSession = {
              access_token: token,
              user: json.user,
            };
            if (typeof window !== "undefined") {
              localStorage.setItem("aurelia_admin_session", JSON.stringify(validSession));
            }
            return validSession;
          }
        }

        // If server indicates session is invalid or unauthenticated, clear client state
        if (typeof window !== "undefined") {
          localStorage.removeItem("aurelia_admin_session");
        }
        return null;
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("aurelia_admin_session");
        }
        return null;
      }
    },

    async signOut(): Promise<void> {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("aurelia_admin_session");
        }
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: getAdminAuthHeaders(),
          credentials: "include",
        });
      } catch (err) {
        console.error("SignOut error:", err);
      }
    },
  },

  // Leads Database Operations (Routed via Secure Server Endpoints)
  leads: {
    async getAll(): Promise<Lead[]> {
      try {
        const res = await fetch("/api/admin/leads", {
          headers: getAdminAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },

    async create(lead: Omit<Lead, "id" | "created_at">): Promise<boolean> {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(lead),
        });
        if (res.ok && typeof window !== "undefined") {
          try {
            const channel = new BroadcastChannel("aurelia_form_sync");
            channel.postMessage({ type: "NEW_LEAD", time: Date.now() });
            channel.close();
          } catch {}
          try {
            localStorage.setItem("aurelia_latest_submission", String(Date.now()));
          } catch {}
        }
        return res.ok;
      } catch {
        return false;
      }
    },

    async updateStatus(id: string, status: Lead["status"]): Promise<boolean> {
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: getAdminAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ status }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: getAdminAuthHeaders(),
          credentials: "include",
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  },

  // Tour Bookings Database Operations (Routed via Secure Server Endpoints)
  tourBookings: {
    async getAll(): Promise<TourBooking[]> {
      try {
        const res = await fetch("/api/admin/tour-bookings", {
          headers: getAdminAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },

    async create(
      booking: Omit<TourBooking, "id" | "created_at">
    ): Promise<boolean> {
      try {
        const res = await fetch("/api/tour-bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(booking),
        });
        if (res.ok && typeof window !== "undefined") {
          try {
            const channel = new BroadcastChannel("aurelia_form_sync");
            channel.postMessage({ type: "NEW_TOUR", time: Date.now() });
            channel.close();
          } catch {}
          try {
            localStorage.setItem("aurelia_latest_submission", String(Date.now()));
          } catch {}
        }
        return res.ok;
      } catch {
        return false;
      }
    },

    async updateStatus(
      id: string,
      status: TourBooking["status"]
    ): Promise<boolean> {
      try {
        const res = await fetch(
          `/api/admin/tour-bookings/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: getAdminAuthHeaders(),
            credentials: "include",
            body: JSON.stringify({ status }),
          }
        );
        return res.ok;
      } catch {
        return false;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        const res = await fetch(
          `/api/admin/tour-bookings/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            headers: getAdminAuthHeaders(),
            credentials: "include",
          }
        );
        return res.ok;
      } catch {
        return false;
      }
    },
  },

  // Properties Operations (Supabase DB + Storage)
  properties: {
    async getAll(): Promise<Property[]> {
      try {
        const res = await fetch("/api/properties", { cache: "no-store" });
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },

    async getById(id: number | string): Promise<Property | null> {
      try {
        const res = await fetch(`/api/properties/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },

    async create(propertyData: Partial<Property>): Promise<{ success: boolean; property?: Property; error?: string }> {
      try {
        const res = await fetch("/api/admin/properties", {
          method: "POST",
          headers: getAdminAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(propertyData),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.error || "Failed to create property." };
        }
        return { success: true, property: json.property };
      } catch (err: any) {
        return { success: false, error: err?.message || "Network error." };
      }
    },

    async update(id: number | string, propertyData: Partial<Property>): Promise<{ success: boolean; property?: Property; error?: string }> {
      try {
        const res = await fetch(`/api/admin/properties/${encodeURIComponent(String(id))}`, {
          method: "PATCH",
          headers: getAdminAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(propertyData),
        });
        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.error || "Failed to update property." };
        }
        return { success: true, property: json.property };
      } catch (err: any) {
        return { success: false, error: err?.message || "Network error." };
      }
    },

    async delete(id: number | string): Promise<boolean> {
      try {
        const res = await fetch(`/api/admin/properties/${encodeURIComponent(String(id))}`, {
          method: "DELETE",
          headers: getAdminAuthHeaders(),
          credentials: "include",
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    async uploadImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
          try {
            const item = localStorage.getItem("aurelia_admin_session");
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed?.access_token && parsed.access_token !== "admin_verified") {
                headers["Authorization"] = `Bearer ${parsed.access_token}`;
              }
            }
          } catch {}
        }

        const res = await fetch("/api/admin/properties/upload", {
          method: "POST",
          headers,
          credentials: "include",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) {
          return { success: false, error: json.error || "Image upload failed." };
        }
        return { success: true, url: json.url };
      } catch (err: any) {
        return { success: false, error: err?.message || "Upload network error." };
      }
    },

    async deleteImage(urlOrFilename: string): Promise<boolean> {
      try {
        const res = await fetch("/api/admin/properties/upload", {
          method: "DELETE",
          headers: getAdminAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ url: urlOrFilename }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  },
};
