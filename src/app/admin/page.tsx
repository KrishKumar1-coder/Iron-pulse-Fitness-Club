"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, ShieldAlert, Lock, Mail, Key, LogOut, 
  Users, Calendar, Building2, TrendingUp, Search, 
  ExternalLink, Download, CheckCircle, Clock, Trash2, 
  Phone, AlertTriangle, ArrowRight, RefreshCw, Eye, EyeOff,
  Bell, BellRing, Volume2, VolumeX, Sparkles, CheckCheck, X,
  Plus, Edit3, Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { 
  supabase, Lead, TourBooking, SupabaseSession 
} from "@/lib/supabase";
import { properties, Property } from "@/data/properties";

// Code-split the heavy PropertyModal so it only loads on demand
const PropertyModal = dynamic(
  () => import("@/components/admin/PropertyModal").then((m) => m.PropertyModal),
  { ssr: false }
);

export interface AdminNotification {
  id: string;
  type: "lead" | "tour";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

// Executive Web Audio API synthesized chime (pleasant luxury dual-tone chord)
function playExecutiveChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Tone 1: Warm D5 note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.6);

    // Tone 2: Shimmering A5 note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.14, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

// Browser desktop notification
function sendDesktopNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch (e) {
        console.warn("Desktop notification error:", e);
      }
    }
  }
}

export type StrictAdminStatus = "New Lead" | "Confirmed" | "Contacted";

export function normalizeStatus(status?: string): StrictAdminStatus {
  if (!status) return "New Lead";
  const s = status.trim().toLowerCase();
  if (s === "confirmed") return "Confirmed";
  if (s === "contacted") return "Contacted";
  return "New Lead";
}

export function getStatusColorClass(status?: string): string {
  const norm = normalizeStatus(status);
  if (norm === "New Lead") return "border-amber-400 text-amber-300";
  if (norm === "Confirmed") return "border-emerald-400 text-emerald-300";
  return "border-sky-400 text-sky-300";
}

export default function AdminPage() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard state (default to all total enquiries for instant visibility)
  const [activeTab, setActiveTab] = useState<"total_enquiries" | "new_appointments" | "portfolio">("total_enquiries");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tours, setTours] = useState<TourBooking[]>([]);
  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>(properties);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [viewingNote, setViewingNote] = useState<{ client_name: string; email: string; property_title?: string; notes: string } | null>(null);

  // Real-Time Notification & Audio States
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [latestToast, setLatestToast] = useState<AdminNotification | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>("default");

  // Tracking known item IDs to detect brand new incoming forms
  const knownLeadIdsRef = useRef<Set<string>>(new Set());
  const knownTourIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
    }
  };

  // Trigger alert when a new lead/tour arrives
  const triggerNewRecordAlert = useCallback((item: AdminNotification) => {
    // 1. Play sound chime if enabled
    if (isSoundEnabled) {
      playExecutiveChime();
    }

    // 2. Show desktop notification
    sendDesktopNotification(item.title, item.description);

    // 3. Show live floating toast banner
    setLatestToast(item);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setLatestToast(null);
    }, 8000);

    // 4. Append to notifications feed
    setNotifications((prev) => [item, ...prev]);

    // 5. Update browser title momentarily
    if (typeof document !== "undefined") {
      const originalTitle = document.title;
      document.title = `🔔 NEW VIP INQUIRY! - Aurelia Admin`;
      setTimeout(() => {
        document.title = originalTitle;
      }, 5000);
    }
  }, [isSoundEnabled]);

  // Helper to identify WhatsApp inquiries (WhatsApp should not trigger notification alerts)
  const isWhatsAppRecord = useCallback((item: {
    client_name?: string;
    email?: string;
    property_title?: string;
    notes?: string;
    special_requests?: string;
    interest_type?: string;
  }) => {
    const text = [
      item.client_name,
      item.email,
      item.property_title,
      item.notes,
      item.special_requests,
      item.interest_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes("whatsapp");
  }, []);

  // Fetch or sync data from Supabase
  const syncDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    try {
      const [fetchedLeads, fetchedTours, fetchedProps] = await Promise.all([
        supabase.leads.getAll(),
        supabase.tourBookings.getAll(),
        isManualRefresh || isInitialLoadRef.current ? supabase.properties.getAll() : Promise.resolve(null),
      ]);

      if (fetchedProps && Array.isArray(fetchedProps) && fetchedProps.length > 0) {
        setPortfolioProperties(fetchedProps);
      }

      if (isInitialLoadRef.current) {
        // First load: record existing IDs without triggering alerts
        (fetchedLeads || []).forEach((l) => knownLeadIdsRef.current.add(l.id));
        (fetchedTours || []).forEach((t) => knownTourIdsRef.current.add(t.id));
        isInitialLoadRef.current = false;
      } else {
        // Subsequent syncs: detect newly arrived records!
        const newLeads = (fetchedLeads || []).filter((l) => !knownLeadIdsRef.current.has(l.id));
        const newTours = (fetchedTours || []).filter((t) => !knownTourIdsRef.current.has(t.id));

        // Alert on new leads (excluding WhatsApp notifications)
        newLeads.forEach((lead) => {
          knownLeadIdsRef.current.add(lead.id);
          if (isWhatsAppRecord(lead)) {
            return; // Explicitly suppress notification for WhatsApp
          }
          triggerNewRecordAlert({
            id: lead.id,
            type: "lead",
            title: `New VIP Inquiry: ${lead.client_name || "Confidential Client"}`,
            description: `Inquired about ${lead.property_title || "Portfolio"} (${lead.interest_type || "Info Request"})`,
            timestamp: new Date(),
            read: false,
          });
        });

        // Alert on new tour requests (excluding WhatsApp notifications)
        newTours.forEach((tour) => {
          knownTourIdsRef.current.add(tour.id);
          if (isWhatsAppRecord(tour)) {
            return; // Explicitly suppress notification for WhatsApp
          }
          triggerNewRecordAlert({
            id: tour.id,
            type: "tour",
            title: `New Tour Request: ${tour.client_name || "Confidential Client"}`,
            description: `Requested viewing for ${tour.property_title || "Estate"} on ${tour.preferred_date || "Flexible date"}`,
            timestamp: new Date(),
            read: false,
          });
        });
      }

      setLeads(fetchedLeads || []);
      setTours(fetchedTours || []);
    } catch (err) {
      console.error("Dashboard sync error:", err);
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [triggerNewRecordAlert, isWhatsAppRecord]);

  // Initial mount: verify real Supabase admin session and redirect if unauthenticated
  useEffect(() => {
    let isMounted = true;
    // Rapid safety fallback: redirect immediately without hanging
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
        window.location.href = "/admin/login";
      }
    }, 1200);

    supabase.auth.getSession()
      .then((sess) => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        if (sess?.user) {
          setSession(sess);
          setIsLoading(false);
          syncDashboardData(true);
        } else {
          setSession(null);
          setIsLoading(false);
          window.location.href = "/admin/login";
        }
      })
      .catch(() => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        setSession(null);
        setIsLoading(false);
        window.location.href = "/admin/login";
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [syncDashboardData]);

  // LIVE INSTANT CROSS-TAB & REAL-TIME SYNC
  useEffect(() => {
    if (!session) return;

    // 1. Efficient auto-polling (idle when tab is hidden to save CPU, battery, and server bandwidth)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      syncDashboardData(false);
    }, 15000);

    // 2. BroadcastChannel: instantly fires on-the-spot (0ms) when any form submits in any tab
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("aurelia_form_sync");
      channel.onmessage = () => {
        syncDashboardData(true);
      };
    } catch {
      // ignore
    }

    // 3. Storage event: fires across browser tabs on the spot
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "aurelia_latest_submission") {
        syncDashboardData(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Focus event: immediate refresh when switching to this tab
    const handleFocus = () => {
      syncDashboardData(false);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncDashboardData]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.location.href = "/admin/login";
  };

  const handleUpdateLeadStatus = async (id: string, status: Lead["status"]) => {
    const ok = await supabase.leads.updateStatus(id, status);
    if (ok) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this confidential lead?")) return;
    const ok = await supabase.leads.delete(id);
    if (ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleUpdateTourStatus = async (id: string, status: TourBooking["status"]) => {
    const ok = await supabase.tourBookings.updateStatus(id, status);
    if (ok) {
      setTours((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment request?")) return;
    const ok = await supabase.tourBookings.delete(id);
    if (ok) {
      setTours((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm("Are you sure you want to delete this property listing? This cannot be undone.")) return;
    const ok = await supabase.properties.delete(id);
    if (ok) {
      setPortfolioProperties((prev) => prev.filter((p) => p.id !== id));
      triggerNewRecordAlert({
        id: `prop-del-${id}`,
        type: "lead",
        title: "Estate Listing Deleted",
        description: `Property #${id} was removed from the active portfolio.`,
        timestamp: new Date(),
        read: false,
      });
    }
  };

  const handlePropertySaveSuccess = (savedProp: Property) => {
    setPortfolioProperties((prev) => {
      const exists = prev.some((p) => p.id === savedProp.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProp.id ? savedProp : p));
      }
      return [savedProp, ...prev];
    });
    triggerNewRecordAlert({
      id: `prop-save-${savedProp.id}`,
      type: "lead",
      title: "Estate Listing Saved",
      description: `"${savedProp.title}" was successfully updated in Supabase.`,
      timestamp: new Date(),
      read: false,
    });
  };

  // Export enquiries/bookings to CSV based on active tab
  const handleExportCSV = () => {
    const listToExport = activeTab === "new_appointments" ? filteredNewAppointments : allSubmissions;
    if (!listToExport || listToExport.length === 0) return;
    const headers = ["Type", "Client Name", "Email", "Phone", "Target Estate / Schedule", "Status", "Date", "Notes"];
    const rows = listToExport.map((item) => [
      `"${item.type_label || item.source}"`,
      `"${item.client_name || ""}"`,
      `"${item.email || ""}"`,
      `"${item.phone || ""}"`,
      `"${(item.property_title || "") + (item.schedule_info ? ` (${item.schedule_info})` : "")}"`,
      `"${normalizeStatus(item.status)}"`,
      `"${item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}"`,
      `"${(item.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filenamePrefix = activeTab === "new_appointments" ? "Aurelia_New_Appointments" : "Aurelia_Total_Enquiries";
    link.setAttribute("download", `${filenamePrefix}_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 text-[#c5a059] animate-spin" />
      </div>
    );
  }

  // ==========================================
  // UNAUTHENTICATED: REDIRECT TO LOGIN
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 text-[#c5a059] animate-spin" />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  const totalValuation = portfolioProperties.reduce((acc, p) => acc + (p?.priceValue || 0), 0);
  const unreadNotifications = (notifications || []).filter((n) => !n?.read).length;

  // Unified all submissions (Inquiries + Tour Requests) in reverse chronological order
  const allSubmissions = [
    ...(leads || []).map((l) => ({
      id: l.id,
      source: "lead" as const,
      client_name: l.client_name || "Confidential Client",
      email: l.email || "—",
      phone: l.phone,
      property_title: l.property_title || "General Portfolio",
      property_price: l.property_price,
      type_label: l.interest_type || "VIP Inquiry",
      schedule_info: null as string | null,
      status: normalizeStatus(l.status),
      created_at: l.created_at || new Date().toISOString(),
      notes: l.notes,
    })),
    ...(tours || []).map((t) => ({
      id: t.id,
      source: "tour" as const,
      client_name: t.client_name || "Confidential Client",
      email: t.email || "—",
      phone: t.phone,
      property_title: t.property_title || "General Portfolio",
      property_price: null as string | null,
      type_label: "Tour Booking",
      schedule_info: `${t.preferred_date || "Earliest Available"} • ${t.preferred_time || "Business Hours"}`,
      status: normalizeStatus(t.status),
      created_at: t.created_at || new Date().toISOString(),
      notes: t.special_requests,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Strictly all bookings & appointments till date whose status is "New Lead"
  const newAppointmentsCount = allSubmissions.filter(
    (item) => normalizeStatus(item.status) === "New Lead"
  ).length;

  const filteredAll = allSubmissions.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (item.client_name || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.phone || "").toLowerCase().includes(q) ||
      (item.property_title || "").toLowerCase().includes(q) ||
      (item.type_label || "").toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    );
  });

  const filteredNewAppointments = allSubmissions.filter((item) => {
    // Strictly show only those whose status is "New Lead"
    if (normalizeStatus(item.status) !== "New Lead") return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (item.client_name || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.phone || "").toLowerCase().includes(q) ||
      (item.property_title || "").toLowerCase().includes(q) ||
      (item.type_label || "").toLowerCase().includes(q) ||
      (item.schedule_info || "").toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(197,160,89,0.06),rgba(0,0,0,0))] selection:bg-[#c5a059]/30">
      {/* ======================================================== */}
      {/* LIVE TOAST NOTIFICATION POPUP BANNER (WHEN FORM IS FILLED) */}
      {/* ======================================================== */}
      {latestToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 max-w-sm w-full bg-[#0d0d0d] border border-[#c5a059] shadow-[0_10px_40px_rgba(197,160,89,0.3)] rounded-2xl p-4 animate-fade-in backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] shrink-0 mt-0.5 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#c5a059]">
                    New Submission Just Now
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h4 className="text-sm font-heading font-medium text-white">{latestToast.title}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{latestToast.description}</p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab(latestToast.type === "tour" ? "new_appointments" : "total_enquiries");
                      setLatestToast(null);
                    }}
                    className="px-3 py-1 bg-[#c5a059] hover:bg-[#dfba74] text-black text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    View in {latestToast.type === "tour" ? "New Appointments" : "Total Enquiries"}
                  </button>
                  <button
                    onClick={() => setLatestToast(null)}
                    className="text-white/40 hover:text-white text-[11px] px-2 py-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLatestToast(null)}
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Top Admin Header Bar */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Brand & Status */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-heading font-light tracking-widest text-white flex items-center gap-1.5">
              <span>AURELIA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-xs uppercase tracking-widest text-[#c5a059] font-medium hidden sm:inline">Principal Office</span>

            {/* Subtle Live Sync Status */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Sync</span>
            </div>
          </div>

          {/* Right Controls - Sleek Single Row */}
          <div className="flex items-center gap-3 text-xs">
            {/* Audio Chime Toggle */}
            <button
              onClick={() => {
                const nextState = !isSoundEnabled;
                setIsSoundEnabled(nextState);
                if (nextState) playExecutiveChime();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isSoundEnabled
                  ? "bg-[#c5a059]/10 border-[#c5a059]/40 text-[#c5a059]"
                  : "bg-white/5 border-white/10 text-white/40"
              }`}
              title={isSoundEnabled ? "Alert Sound Enabled (Click to mute)" : "Alert Sound Muted (Click to enable)"}
            >
              {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSoundEnabled ? "Chime On" : "Muted"}</span>
            </button>

            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Activity Feed"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c0c0c] border border-white/15 shadow-2xl backdrop-blur-2xl p-4 z-50 animate-fade-in text-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-semibold uppercase tracking-wider text-white">Live Activity Feed</span>
                      {unreadNotifications > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#c5a059] text-black font-bold">
                          {unreadNotifications} New
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                        className="text-[11px] text-[#c5a059] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Desktop Push Notifications Toggle inside Dropdown */}
                  {desktopPermission !== "granted" && (
                    <button
                      onClick={requestDesktopPermission}
                      className="w-full py-2 px-3 rounded-xl bg-[#c5a059]/10 hover:bg-[#c5a059]/20 border border-[#c5a059]/30 text-[#c5a059] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Enable Desktop Alerts</span>
                    </button>
                  )}

                  <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-white/40">
                        <Bell className="w-6 h-6 text-white/20 mx-auto mb-2" />
                        <p>No recent submissions yet.</p>
                        <p className="text-[10px] text-white/30 mt-1">Live monitoring is active.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`pt-2 pb-1 space-y-1 transition-colors cursor-pointer ${
                            !n.read ? "bg-[#c5a059]/5 p-2 rounded-lg" : ""
                          }`}
                          onClick={() => {
                            setActiveTab(n.type === "tour" ? "new_appointments" : "total_enquiries");
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-white">{n.title}</p>
                            <span className="text-[10px] text-white/40">
                              {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60">{n.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Verified Admin User Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 font-mono text-[11px]">{session.user.email}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#c5a059]/20 text-[#c5a059] font-semibold">OWNER</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <span>View Site</span>
              <ExternalLink className="w-3 h-3 text-[#c5a059]" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-1">
            <div className="flex justify-between items-center text-xs text-white/50">
              <span>Total Enquiries</span>
              <Users className="w-4 h-4 text-[#c5a059]" />
            </div>
            <p className="text-3xl font-heading font-light text-white">{allSubmissions.length}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span>All recorded bookings till date</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-1">
            <div className="flex justify-between items-center text-xs text-white/50">
              <span>New Appointments</span>
              <Calendar className="w-4 h-4 text-[#c5a059]" />
            </div>
            <p className="text-3xl font-heading font-light text-white">{newAppointmentsCount}</p>
            <p className="text-[11px] text-amber-400">
              <span>{newAppointmentsCount} awaiting follow-up</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-1">
            <div className="flex justify-between items-center text-xs text-white/50">
              <span>Active Listings</span>
              <Building2 className="w-4 h-4 text-[#c5a059]" />
            </div>
            <p className="text-3xl font-heading font-light text-white">{portfolioProperties.length}</p>
            <p className="text-[11px] text-white/40">Across prime markets</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/10 space-y-1">
            <div className="flex justify-between items-center text-xs text-white/50">
              <span>Total Listing Value</span>
              <TrendingUp className="w-4 h-4 text-[#c5a059]" />
            </div>
            <p className="text-2xl font-mono font-light text-[#c5a059]">
              ${(totalValuation / 1000000).toFixed(1)}M USD
            </p>
            <p className="text-[11px] text-white/40">Combined portfolio value</p>
          </div>
        </div>

        {/* Tab Controls & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("total_enquiries")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "total_enquiries"
                  ? "bg-[#c5a059] text-black shadow-lg"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span>Total Enquiries ({allSubmissions.length})</span>
              {newAppointmentsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("new_appointments")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "new_appointments"
                  ? "bg-[#c5a059] text-black shadow-lg"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span>New Appointments ({newAppointmentsCount})</span>
              {newAppointmentsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "portfolio"
                  ? "bg-[#c5a059] text-black shadow-lg"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              Active Listings ({portfolioProperties.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => syncDashboardData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Manual Sync from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#c5a059]" : ""}`} />
            </button>

            {activeTab !== "portfolio" && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 0: TOTAL ENQUIRIES (ALL BOOKINGS TILL DATE) */}
        {activeTab === "total_enquiries" && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search total enquiries by client, email, estate, schedule..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            {filteredAll.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#0c0c0c] border border-white/10 text-white/40">
                <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm">No submissions found matching query.</p>
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[1000px] text-left text-xs text-white/80 border-collapse">
                    <thead className="bg-white/[0.03] text-white/40 uppercase tracking-widest text-[10px] border-b border-white/10">
                      <tr>
                        <th className="py-3.5 px-4 min-w-[150px] max-w-[180px] whitespace-nowrap">Client</th>
                        <th className="py-3.5 px-4 min-w-[190px] whitespace-nowrap">Direct Contact</th>
                        <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">Target Estate & Schedule</th>
                        <th className="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Status</th>
                        <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">Date</th>
                        <th className="py-3.5 px-4 text-right min-w-[120px] whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAll.map((item) => (
                        <tr key={`${item.source}-${item.id}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 font-medium text-white min-w-[150px] max-w-[180px]">
                            <p className="font-heading text-sm truncate" title={item.client_name}>
                              {item.client_name}
                            </p>
                            {item.notes && (
                              <button
                                type="button"
                                onClick={() => setViewingNote({ 
                                  client_name: item.client_name, 
                                  email: item.email, 
                                  property_title: item.property_title || undefined, 
                                  notes: item.notes || "" 
                                })}
                                className="inline-flex items-center gap-1 text-[10px] text-[#c5a059] hover:text-[#dfba74] hover:underline mt-1 font-medium cursor-pointer"
                                title="Click to view full note"
                              >
                                <span>Read note</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-4 space-y-0.5 min-w-[190px]">
                            <p className="font-mono text-white/90">{item.email}</p>
                            {item.phone && <p className="text-white/50">{item.phone}</p>}
                          </td>
                          <td className="py-4 px-4 min-w-[220px] max-w-[280px]">
                            <p className="text-white font-medium leading-snug">{item.property_title}</p>
                            {item.schedule_info ? (
                              <div className="flex items-center gap-1 text-[11px] text-[#c5a059] font-mono mt-0.5">
                                <Calendar className="w-3 h-3 text-[#c5a059] shrink-0" />
                                <span>{item.schedule_info}</span>
                              </div>
                            ) : item.type_label ? (
                              <div className="flex items-center gap-1 text-[11px] text-[#c5a059] font-mono mt-0.5">
                                <span>{item.type_label}</span>
                                {item.property_price && <span className="text-white/40">• {item.property_price}</span>}
                              </div>
                            ) : item.property_price ? (
                              <p className="text-[#c5a059] font-mono text-[11px] mt-0.5">{item.property_price}</p>
                            ) : null}
                          </td>
                          <td className="py-4 px-4 min-w-[150px]">
                            <select
                              value={normalizeStatus(item.status)}
                              onChange={(e) => {
                                const newStatus = e.target.value as StrictAdminStatus;
                                if (item.source === "tour") {
                                  handleUpdateTourStatus(item.id, newStatus);
                                } else {
                                  handleUpdateLeadStatus(item.id, newStatus);
                                }
                              }}
                              className={`bg-[#151515] text-[11px] font-medium border rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer ${getStatusColorClass(item.status)}`}
                            >
                              <option value="New Lead">New Lead</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Contacted">Contacted</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-white/50 font-mono text-[11px] min-w-[110px] whitespace-nowrap">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="py-4 px-4 text-right min-w-[120px]">
                            <div className="flex items-center justify-end gap-1.5">
                              {normalizeStatus(item.status) === "New Lead" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.source === "tour") {
                                      handleUpdateTourStatus(item.id, "Confirmed");
                                    } else {
                                      handleUpdateLeadStatus(item.id, "Confirmed");
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Confirm this item"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Confirm</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (item.source === "tour") {
                                    handleDeleteTour(item.id);
                                  } else {
                                    handleDeleteLead(item.id);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-red-950/50 text-white/40 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: NEW APPOINTMENTS (STRICTLY STATUS === "New Lead") */}
        {activeTab === "new_appointments" && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search new appointments by client, estate, contact..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            {filteredNewAppointments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#0c0c0c] border border-white/10 text-white/40 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400/70 mx-auto mb-2" />
                <p className="text-sm font-medium text-white/70">No new appointments awaiting follow-up.</p>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  All tour appointments have been processed or confirmed.
                </p>
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[1000px] text-left text-xs text-white/80 border-collapse">
                    <thead className="bg-white/[0.03] text-white/40 uppercase tracking-widest text-[10px] border-b border-white/10">
                      <tr>
                        <th className="py-3.5 px-4 min-w-[160px] max-w-[200px] whitespace-nowrap">Client</th>
                        <th className="py-3.5 px-4 min-w-[190px] whitespace-nowrap">Direct Contact</th>
                        <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">Estate & Schedule</th>
                        <th className="py-3.5 px-4 min-w-[170px] whitespace-nowrap">Status</th>
                        <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">Date</th>
                        <th className="py-3.5 px-4 text-right min-w-[120px] whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredNewAppointments.map((item) => (
                        <tr key={`${item.source}-${item.id}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 font-medium text-white min-w-[150px] max-w-[180px]">
                            <p className="font-heading text-sm truncate" title={item.client_name}>
                              {item.client_name}
                            </p>
                            {item.notes && (
                              <button
                                type="button"
                                onClick={() => setViewingNote({ 
                                  client_name: item.client_name, 
                                  email: item.email, 
                                  property_title: item.property_title || undefined, 
                                  notes: item.notes || "" 
                                })}
                                className="inline-flex items-center gap-1 text-[10px] text-[#c5a059] hover:text-[#dfba74] hover:underline mt-1 font-medium cursor-pointer"
                                title="Click to view full note"
                              >
                                <span>Read note</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-4 space-y-0.5 min-w-[190px]">
                            <p className="font-mono text-white/90">{item.email}</p>
                            {item.phone && <p className="text-white/50">{item.phone}</p>}
                          </td>
                          <td className="py-4 px-4 min-w-[220px] max-w-[280px]">
                            <p className="text-white font-medium leading-snug">{item.property_title}</p>
                            {item.schedule_info ? (
                              <div className="flex items-center gap-1 text-[11px] text-[#c5a059] font-mono mt-0.5">
                                <Calendar className="w-3 h-3 text-[#c5a059] shrink-0" />
                                <span>{item.schedule_info}</span>
                              </div>
                            ) : item.type_label ? (
                              <div className="flex items-center gap-1 text-[11px] text-[#c5a059] font-mono mt-0.5">
                                <span>{item.type_label}</span>
                                {item.property_price && <span className="text-white/40">• {item.property_price}</span>}
                              </div>
                            ) : item.property_price ? (
                              <p className="text-[#c5a059] font-mono text-[11px] mt-0.5">{item.property_price}</p>
                            ) : null}
                          </td>
                          <td className="py-4 px-4 min-w-[150px]">
                            <select
                              value={normalizeStatus(item.status)}
                              onChange={(e) => {
                                const newStatus = e.target.value as StrictAdminStatus;
                                if (item.source === "tour") {
                                  handleUpdateTourStatus(item.id, newStatus);
                                } else {
                                  handleUpdateLeadStatus(item.id, newStatus);
                                }
                              }}
                              className={`bg-[#151515] text-[11px] font-medium border rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer ${getStatusColorClass(item.status)}`}
                            >
                              <option value="New Lead">New Lead</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Contacted">Contacted</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-white/50 font-mono text-[11px] min-w-[110px] whitespace-nowrap">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="py-4 px-4 text-right min-w-[120px]">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.source === "tour") {
                                    handleUpdateTourStatus(item.id, "Confirmed");
                                  } else {
                                    handleUpdateLeadStatus(item.id, "Confirmed");
                                  }
                                }}
                                className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Confirm this item"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Confirm</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (item.source === "tour") {
                                    handleDeleteTour(item.id);
                                  } else {
                                    handleDeleteLead(item.id);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-red-950/50 text-white/40 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PORTFOLIO ASSET OVERVIEW & MANAGEMENT */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            {/* Top Bar for Properties Tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0f0e0b] via-[#0c0c0c] to-[#0f0e0b] border border-[#c5a059]/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]">
                    Estate Asset Management
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30">
                    {portfolioProperties.length} Estates Active
                  </span>
                </div>
                <h3 className="text-xl font-heading font-light text-white">
                  Curated Real Estate Portfolio
                </h3>
                <p className="text-xs text-white/50">
                  Manage estate listings, pricing, luxury specifications, and high-resolution media stored in Supabase Storage.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProperty(null);
                  setIsPropertyModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba74] hover:from-[#dfba74] hover:to-[#c5a059] text-black font-semibold text-xs tracking-wider uppercase shadow-[0_4px_20px_rgba(197,160,89,0.3)] transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Property</span>
              </button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioProperties.map((prop) => {
                const coverImage = prop.images && prop.images.length > 0 ? prop.images[0] : null;
                const photoCount = prop.images ? prop.images.length : 0;

                return (
                  <div 
                    key={prop.id}
                    className="group rounded-2xl bg-[#0c0c0c] border border-white/10 hover:border-[#c5a059]/60 transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
                  >
                    {/* Media Cover */}
                    <div className="h-48 relative w-full bg-[#141414] overflow-hidden">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={prop.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-white/30">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs uppercase tracking-wider">No Media</span>
                        </div>
                      )}

                      {/* Gradient Overlay for badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md border border-[#c5a059]/50 text-[#c5a059]">
                          {prop.badge || prop.type}
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md border ${
                          prop.status === "Available" 
                            ? "bg-emerald-950/80 border-emerald-400/40 text-emerald-300"
                            : prop.status === "Under Contract"
                            ? "bg-amber-950/80 border-amber-400/40 text-amber-300"
                            : "bg-white/10 border-white/20 text-white/80"
                        }`}>
                          {prop.status}
                        </span>
                      </div>

                      {/* Bottom Image Counter */}
                      <div className="absolute bottom-3 right-3 pointer-events-none">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/80 backdrop-blur-md border border-white/15 text-white/80 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-[#c5a059]" />
                          <span>{photoCount} {photoCount === 1 ? "photo" : "photos"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] uppercase tracking-widest text-[#c5a059] font-semibold">{prop.type}</span>
                          <span className="text-white/40 text-[10px] font-mono">ID: #{prop.id}</span>
                        </div>
                        <h4 className="text-lg font-heading font-medium text-white group-hover:text-[#c5a059] transition-colors line-clamp-1" title={prop.title}>
                          {prop.title}
                        </h4>
                        <p className="text-xs text-white/50 line-clamp-1">{prop.location}</p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-baseline">
                          <p className="text-xl font-mono text-[#c5a059] font-light">{prop.price}</p>
                          <p className="text-xs text-white/50">{prop.beds} Beds • {prop.baths} Baths</p>
                        </div>
                        <p className="text-[11px] text-white/40 font-mono">
                          {prop.sqft ? `${Number(String(prop.sqft).replace(/[^0-9]/g, "")).toLocaleString()} sq ft` : "Exclusive Layout"}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProperty(prop);
                              setIsPropertyModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/30 text-[#c5a059] border border-[#c5a059]/30 text-xs font-medium transition-colors cursor-pointer"
                            title="Edit Property & Images"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/70 text-red-400 border border-red-500/20 text-xs font-medium transition-colors cursor-pointer"
                            title="Delete Estate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <Link
                          href={`/properties/${prop.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-[#c5a059] transition-colors"
                        >
                          <span>Public Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full Note Reading Modal */}
      {viewingNote && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setViewingNote(null)}
        >
          <div 
            className="w-full max-w-lg bg-[#0e0e0e] border border-[#c5a059]/40 rounded-2xl p-6 shadow-2xl space-y-4 text-white animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]">Client Note Details</span>
                <h3 className="text-lg font-heading font-medium text-white mt-0.5">{viewingNote.client_name}</h3>
                <p className="text-xs text-white/50 font-mono mt-0.5">{viewingNote.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingNote(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingNote.property_title && (
              <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs flex justify-between items-center">
                <span className="text-white/40">Inquired Property:</span>
                <span className="text-[#c5a059] font-medium">{viewingNote.property_title}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-white/40 font-semibold block">
                Full Inquiry Note / Message:
              </label>
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 max-h-72 overflow-y-auto scrollbar-thin">
                <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
                  {viewingNote.notes}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingNote(null)}
                className="px-4 py-2 rounded-xl bg-[#c5a059] hover:bg-[#dfba74] text-black text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Add/Edit & Media Modal (Loaded lazily on demand) */}
      {isPropertyModalOpen && (
        <PropertyModal
          isOpen={isPropertyModalOpen}
          onClose={() => {
            setIsPropertyModalOpen(false);
            setEditingProperty(null);
          }}
          onSuccess={handlePropertySaveSuccess}
          propertyToEdit={editingProperty}
        />
      )}
    </main>
  );
}
