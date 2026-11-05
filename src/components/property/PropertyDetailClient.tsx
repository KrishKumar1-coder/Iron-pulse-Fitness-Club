"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, MapPin, BedDouble, Bath, Square, 
  Share2, Heart, Award, ShieldCheck, Compass, Maximize2, Sparkles, Building2
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { properties, Property } from "@/data/properties";
import { useCurrency } from "@/context/CurrencyContext";
import { useFavorites } from "@/context/FavoritesContext";
import { supabase } from "@/lib/supabase";

// Dynamically code-split non-critical modals and heavy sub-tabs
const VirtualTourModal = dynamic(
  () => import("@/components/layout/VirtualTourModal").then((m) => m.VirtualTourModal),
  { ssr: false }
);
const LovePropertyModal = dynamic(
  () => import("@/components/layout/LovePropertyModal").then((m) => m.LovePropertyModal),
  { ssr: false }
);
const FloorPlanViewer = dynamic(
  () => import("@/components/property/FloorPlanViewer").then((m) => m.FloorPlanViewer),
  { ssr: false }
);
const NeighborhoodLifestyle = dynamic(
  () => import("@/components/property/NeighborhoodLifestyle").then((m) => m.NeighborhoodLifestyle),
  { ssr: false }
);

interface PropertyDetailClientProps {
  propertyId: number;
  initialProperty?: Property;
}

export function PropertyDetailClient({ propertyId, initialProperty }: PropertyDetailClientProps) {
  const staticProperty = initialProperty || properties.find((p) => p.id === propertyId);
  const [property, setProperty] = useState<Property | undefined>(staticProperty);
  const [isLoadingProperty, setIsLoadingProperty] = useState(!staticProperty);
  const { formatPrice, formatArea } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeImage, setActiveImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "floorplan" | "3dtour" | "lifestyle" | "mortgage">("overview");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isLoveModalOpen, setIsLoveModalOpen] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(`/api/properties/${propertyId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          const loadedProp = data.property || (data.id ? data : null);
          if (loadedProp) {
            setProperty(loadedProp);
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Failed to load live property details:", err);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (isMounted) setIsLoadingProperty(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [propertyId]);

  const handleHeartClick = () => {
    if (!property) return;
    if (isFavorite(property.id)) {
      toggleFavorite(property.id);
      return;
    }

    // Instagram-style spring pop animation
    setIsHeartAnimating(true);
    toggleFavorite(property.id);

    // After animation (~750ms), open the private inquiry modal
    setTimeout(() => {
      setIsHeartAnimating(false);
      setIsLoveModalOpen(true);
    }, 750);
  };

  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);

  // Compute monthly payment memoized without triggering cascading re-renders
  const monthlyPayment = useMemo(() => {
    if (!property) return 0;
    const principal = property.priceValue * (1 - downPaymentPercent / 100);
    const monthlyRate = (interestRate / 100) / 12;
    const totalPayments = loanTermYears * 12;

    if (monthlyRate === 0) {
      return Math.round(principal / totalPayments);
    }
    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                    (Math.pow(1 + monthlyRate, totalPayments) - 1);
    return Math.round(payment);
  }, [downPaymentPercent, interestRate, loanTermYears, property]);

  const [isBooked, setIsBooked] = useState(false);
  const [tourName, setTourName] = useState("");
  const [tourEmail, setTourEmail] = useState("");
  const [tourPhone, setTourPhone] = useState("");
  const [tourMessage, setTourMessage] = useState("");
  const [isTourSubmitting, setIsTourSubmitting] = useState(false);
  const [tourError, setTourError] = useState<string | null>(null);

  const handleTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setTourError(null);
    const cleanName = tourName.trim() || "VIP Client";
    const cleanPhone = tourPhone.trim() || undefined;
    const cleanEmail = tourEmail.trim() || (cleanPhone ? `${cleanPhone.replace(/\D/g, "")}@phoneinquiry.com` : "vip@client.com");

    if (!tourName.trim() && !tourPhone.trim() && !tourEmail.trim()) return;

    setIsTourSubmitting(true);

    try {
      // 1. Save Tour Booking to Supabase
      const okTour = await supabase.tourBookings.create({
        client_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        preferred_date: "Earliest Available",
        preferred_time: "Business Hours",
        property_title: property.title,
        special_requests: `Enquiry for ${property.title}${tourMessage.trim() ? ` • Note: ${tourMessage.trim()}` : ""}`,
        status: "Pending",
      });

      // 2. Also register VIP Lead in Supabase
      const okLead = await supabase.leads.create({
        client_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        property_id: property.id,
        property_title: property.title,
        property_location: property.location,
        property_price: property.price,
        interest_type: `Enquiry for ${property.title}`,
        status: "New",
        notes: tourMessage.trim() ? `Enquiry for ${property.title} — Note: ${tourMessage.trim()}` : `Enquiry for ${property.title}`,
      });

      if (okTour || okLead) {
        setIsBooked(true);
      } else {
        setTourError("Submission could not be completed. If you recently sent multiple inquiries, please wait 60 seconds before trying again.");
      }
    } catch (err) {
      console.error("Error submitting tour request:", err);
      setTourError("Network communication error. Please try again or reach our desk directly at +1 (310) 899-4000.");
    } finally {
      setIsTourSubmitting(false);
    }
  };

  const currentDisplayImage = activeImage || property?.images[0] || "";

  if (isLoadingProperty) {
    return (
      <main className="min-h-screen bg-[#060608] text-white flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-6 py-40 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-heading text-white">Loading Residence Details...</h2>
          <p className="text-xs text-white/40 mt-1 font-mono">Fetching estate records from Aurelia Registry</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-[#060608] text-white flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-6 py-40 text-center">
          <h2 className="text-3xl font-heading mb-4">Property Not Found</h2>
          <p className="text-white/40 mb-8">The luxury residence you are looking for does not exist or has been sold.</p>
          <Link href="/" className="px-6 py-3 bg-[#c5a059] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Return to Main Page
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-white flex flex-col overflow-hidden relative">
      <Navbar />

      <div 
        className="absolute top-20 right-0 w-[600px] h-[600px] blur-[180px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(197, 160, 89, 0.18)" }}
      />

      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 relative z-10 flex-1 max-w-7xl">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#c5a059]" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Back to Main Page</span>
          </Link>

          <div className="flex gap-2 sm:gap-3">
            <button 
              type="button"
              onClick={handleHeartClick}
              className={`relative p-2.5 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center border rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
                isFavorite(property.id)
                  ? "bg-red-500/15 border-red-500/40 text-red-500"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
              }`} 
              title={isFavorite(property.id) ? "Remove from Loved Homes" : "You might love this home!"}
              aria-label={isFavorite(property.id) ? "Remove from Loved Homes" : "You might love this home!"}
            >
              {isHeartAnimating && (
                <span className="absolute inset-0 rounded-xl border-2 border-red-500/90 animate-heart-burst pointer-events-none" />
              )}
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                isHeartAnimating
                  ? "animate-heart-pop fill-red-500 text-red-500"
                  : (isFavorite(property.id) ? "fill-red-500 text-red-500" : "text-white")
              }`} />
            </button>
            <button 
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator.share({ title: property.title, url: window.location.href }).catch(() => {});
                } else if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Residence link copied to clipboard!");
                } else if (typeof document !== "undefined") {
                  const textarea = document.createElement("textarea");
                  textarea.value = window.location.href;
                  textarea.style.position = "fixed";
                  textarea.style.opacity = "0";
                  document.body.appendChild(textarea);
                  textarea.select();
                  try { document.execCommand("copy"); } catch { }
                  document.body.removeChild(textarea);
                  alert("Residence link copied to clipboard!");
                }
              }}
              className="p-2.5 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer active:scale-95 touch-manipulation" 
              title="Share Residence"
              aria-label="Share Residence"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <div className="relative w-full h-[280px] sm:h-[420px] md:h-[580px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02]">
            <Image
              src={currentDisplayImage}
              alt={property.title}
              fill
              className="object-cover transition-all duration-700"
              priority
              quality={85}
              sizes="100vw"
            />

            {/* Instagram-style floating heart pop in center of main image */}
            {isHeartAnimating && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="animate-heart-pop p-4 sm:p-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl">
                  <Heart className="w-12 h-12 sm:w-16 sm:h-16 fill-red-500 text-red-500 filter drop-shadow-[0_0_24px_rgba(239,68,68,0.9)]" />
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-2 sm:gap-3">
              <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-[#c5a059]">
                {property.badge}
              </span>
              <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-[#c5a059] text-black">
                {property.status}
              </span>
            </div>

            {/* 3D Walkthrough Badge Button — bottom-right on mobile, top-right on sm+ */}
            {property.virtualTourUrl && (
              <button
                type="button"
                onClick={() => setIsTourOpen(true)}
                className="absolute bottom-4 right-4 sm:bottom-auto sm:top-6 sm:right-6 flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2 min-h-[36px] rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-black/75 backdrop-blur-md border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition-all cursor-pointer shadow-2xl group active:scale-95 touch-manipulation"
                aria-label="Explore in 3D"
              >
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-45 transition-transform" />
                <span>Explore in 3D</span>
              </button>
            )}
          </div>

          {property.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {property.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    currentDisplayImage === img ? "border-[#c5a059] scale-105 shadow-lg" : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${property.title} gallery photo ${index + 1}`} fill className="object-cover" sizes="112px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="border-b border-white/10 pb-8 space-y-4">
              <div className="flex items-center gap-2 text-[#c5a059] text-sm">
                <MapPin className="w-4 h-4" />
                <span>{property.location}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading tracking-tight text-white">{property.title}</h1>
              <p className="text-3xl md:text-4xl text-[#c5a059] font-light">{formatPrice(property.priceValue)}</p>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <BedDouble className="w-4 h-4 sm:w-5 sm:h-5 text-[#c5a059] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-white/40 truncate">Bedrooms</p>
                    <p className="text-sm sm:text-lg font-medium">{property.beds}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-[#c5a059] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-white/40 truncate">Bathrooms</p>
                    <p className="text-sm sm:text-lg font-medium">{property.baths}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 text-[#c5a059] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-white/40 truncate">Interior Area</p>
                    <p className="text-sm sm:text-lg font-medium truncate">{formatArea(property.sqft)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 gap-6 sm:gap-8 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: "overview", label: "About This Home" },
                  { id: "floorplan", label: "Floor Plans" },
                  ...(property.virtualTourUrl ? [{ id: "3dtour", label: "3D Virtual Tour" }] : []),
                  ...(property.neighborhood ? [{ id: "lifestyle", label: "Neighborhood & Driving Times" }] : []),
                  { id: "mortgage", label: "Mortgage Calculator" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`pb-4 text-sm uppercase tracking-wider font-medium transition-all relative cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id ? "text-[#c5a059]" : "text-white/50 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a059]" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-heading mb-4 text-white">Property Overview</h3>
                  <p className="text-white/70 leading-relaxed text-base">{property.description}</p>
                </div>

                <div>
                  <h3 className="text-xl font-heading mb-4 text-white">Room Sizes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {property.dimensions?.map((dim, i) => (
                      <div key={i} className="flex justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <span className="text-white/60">{dim.room}</span>
                        <span className="font-medium text-[#c5a059]">{dim.size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Neighborhood & Driving Times Teaser */}
                {property.neighborhood && (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-xs uppercase tracking-widest text-[#c5a059] font-medium">Prime Location</span>
                        <h4 className="text-lg font-heading text-white">{property.neighborhood.district}</h4>
                      </div>
                      <button
                        onClick={() => setActiveTab("lifestyle")}
                        className="text-xs text-[#c5a059] hover:underline font-medium self-start sm:self-auto cursor-pointer"
                      >
                        View All Driving Times &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      {property.neighborhood.destinations.slice(0, 3).map((dest, i) => (
                        <div 
                          key={i} 
                          onClick={() => setActiveTab("lifestyle")}
                          className="group/card relative h-28 rounded-xl overflow-hidden border border-white/10 hover:border-[#c5a059]/50 transition-all cursor-pointer shadow-md"
                        >
                          {dest.image && (
                            <Image
                              src={dest.image}
                              alt={dest.name}
                              fill
                              className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                          
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-[#c5a059]/40 text-[#c5a059] font-mono font-semibold text-[10px]">
                              {dest.time}
                            </span>
                          </div>

                          <div className="absolute bottom-2.5 inset-x-3">
                            <p className="text-xs font-heading font-medium text-white group-hover/card:text-[#c5a059] transition-colors truncate">
                              {dest.name}
                            </p>
                            <p className="text-[10px] text-white/60 truncate font-light">
                              {dest.highlight}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "floorplan" && (
              <FloorPlanViewer 
                property={property} 
                onRequestCadDossier={() => setIsLoveModalOpen(true)}
              />
            )}

            {activeTab === "3dtour" && property.virtualTourUrl && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-heading text-white">Interactive 3D Walkthrough</h3>
                    <p className="text-xs text-white/50">Explore every room in full 360-degree high resolution.</p>
                  </div>
                  <button
                    onClick={() => setIsTourOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#c5a059] text-black font-semibold text-xs uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fullscreen 3D</span>
                  </button>
                </div>

                <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
                  <iframe
                    src={property.virtualTourUrl}
                    title={`${property.title} 3D Tour`}
                    className="w-full h-full border-0"
                    allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>

                <p className="text-xs text-white/50 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Click floor circles to walk forward &bull; Click and drag to look 360&deg; &bull; Scroll to zoom</span>
                </p>
              </div>
            )}

            {activeTab === "lifestyle" && (
              <NeighborhoodLifestyle 
                property={property} 
                onBookTour={() => setIsLoveModalOpen(true)}
              />
            )}

            {activeTab === "mortgage" && (
              <div className="space-y-6 bg-white/[0.02] border border-white/10 p-8 rounded-2xl">
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-heading text-white">Financing Simulation</h3>
                    <p className="text-xs text-white/40 mt-1">Estimated monthly repayment</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Est. Monthly</p>
                    <p className="text-3xl font-heading text-[#c5a059]">{formatPrice(monthlyPayment)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="text-xs text-white/60 block mb-2">Down Payment ({downPaymentPercent}%)</label>
                    <input 
                      type="range" 
                      min="10" 
                      max="50" 
                      value={downPaymentPercent} 
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full accent-[#c5a059]"
                    />
                    <span className="text-xs text-white/40 mt-1 block">
                      {formatPrice((property.priceValue * downPaymentPercent) / 100)}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 block mb-2">Interest Rate ({interestRate}%)</label>
                    <input 
                      type="range" 
                      min="3" 
                      max="12" 
                      step="0.1" 
                      value={interestRate} 
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full accent-[#c5a059]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 block mb-2">Loan Term</label>
                    <select 
                      value={loanTermYears} 
                      onChange={(e) => setLoanTermYears(Number(e.target.value))}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-base sm:text-sm text-white focus:border-[#c5a059] focus:outline-none"
                    >
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                      <option value={30}>30 Years</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 sticky top-32 space-y-5 shadow-2xl">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#c5a059] font-semibold">Interested in this residence?</span>
                <h3 className="text-xl font-heading text-white mt-0.5">Contact Advisory Desk</h3>
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-xs text-[#c5a059] flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate text-white font-medium">Enquiry for {property.title}</span>
                </div>
              </div>

              {isBooked ? (
                <div className="p-6 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-xl text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-[#c5a059] mx-auto" />
                  <h4 className="text-base font-semibold text-white">Inquiry Submitted!</h4>
                  <p className="text-xs text-white/60">Our advisor will reach out to you within 2 business hours.</p>
                </div>
              ) : (
                <form 
                  onSubmit={handleTourSubmit}
                  className="space-y-3"
                >
                  {tourError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs leading-relaxed animate-fade-in">
                      {tourError}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/60 block font-medium mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={tourName}
                      onChange={(e) => setTourName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-base sm:text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/60 block font-medium mb-1">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={tourPhone}
                      onChange={(e) => setTourPhone(e.target.value)}
                      placeholder="e.g. +1 (310) 899-4000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-base sm:text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/60 block font-medium mb-1">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={tourEmail}
                      onChange={(e) => setTourEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-base sm:text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/60 block font-medium mb-1">
                      Message / Note <span className="text-white/30 text-[10px] lowercase">(optional)</span>
                    </label>
                    <textarea 
                      rows={2}
                      value={tourMessage}
                      onChange={(e) => setTourMessage(e.target.value)}
                      placeholder="Ask a question or request private viewing..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-base sm:text-sm text-white placeholder-white/25 focus:border-[#c5a059] focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTourSubmitting}
                    className="w-full py-3.5 min-h-[48px] bg-[#c5a059] hover:opacity-90 text-black font-semibold uppercase tracking-wider text-xs rounded-xl transition-opacity cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center touch-manipulation active:scale-[0.98]"
                  >
                    {isTourSubmitting ? "Sending Inquiry..." : "Submit Inquiry"}
                  </button>
                </form>
              )}

              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <Award className="w-4 h-4 text-[#c5a059]" />
                  <span>Licensed Real Estate Agency in California & Florida</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 3D Virtual Tour Fullscreen Modal */}
      {property.virtualTourUrl && (
        <VirtualTourModal
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          tourUrl={property.virtualTourUrl}
          propertyTitle={property.title}
          propertyLocation={property.location}
        />
      )}

      {/* Love Property Lead Capture Modal */}
      <LovePropertyModal
        isOpen={isLoveModalOpen}
        onClose={() => setIsLoveModalOpen(false)}
        property={property}
        onSaved={(id) => {
          if (!isFavorite(id)) {
            toggleFavorite(id);
          }
        }}
      />

      <Footer />
    </main>
  );
}

