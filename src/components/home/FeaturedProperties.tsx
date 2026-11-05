"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Heart, Maximize2, BedDouble, Bath, Square, MapPin, Compass, MessageSquare } from "lucide-react";
import { PropertyFilters } from "@/types/filters";
import { properties, Property } from "@/data/properties";
import { useCurrency } from "@/context/CurrencyContext";
import { useFavorites } from "@/context/FavoritesContext";
import { cn } from "@/utils/cn";

// Code-split modals so they only load when triggered
const VirtualTourModal = dynamic(
  () => import("@/components/layout/VirtualTourModal").then((m) => m.VirtualTourModal),
  { ssr: false }
);
const LovePropertyModal = dynamic(
  () => import("@/components/layout/LovePropertyModal").then((m) => m.LovePropertyModal),
  { ssr: false }
);

interface Props {
  filters: PropertyFilters;
  isSearched: boolean;
  onViewAll?: () => void;
  onOpenConsultation?: (location: string) => void;
}

export function FeaturedProperties({ filters, isSearched, onViewAll, onOpenConsultation }: Props) {
  const { formatPrice, formatArea } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [allProperties, setAllProperties] = useState<Property[]>(properties);
  const [activeTourProperty, setActiveTourProperty] = useState<Property | null>(null);
  const [lovedProperty, setLovedProperty] = useState<Property | null>(null);
  const [animatingHeartId, setAnimatingHeartId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch("/api/properties", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          const list = Array.isArray(data) ? data : (Array.isArray(data.properties) ? data.properties : null);
          if (list && list.length > 0) {
            setAllProperties(list);
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Failed to fetch live properties:", err);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleHeartClick = (e: React.MouseEvent, prop: Property) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite(prop.id)) {
      toggleFavorite(prop.id);
      return;
    }

    // Instagram-style spring pop animation
    setAnimatingHeartId(prop.id);
    toggleFavorite(prop.id);

    // After animation finishes (~750ms), gracefully open the private inquiry modal
    setTimeout(() => {
      setAnimatingHeartId(null);
      setLovedProperty(prop);
    }, 750);
  };

  const filtered = useMemo(() => {
    return allProperties.filter((p) => {
      if (!isSearched) return true; // show all before first search

      // 1. Location match
      const locQuery = (filters.location || "").trim().toLowerCase();
      const isAllLocs = !locQuery || locQuery === "all locations";
      let locMatch = isAllLocs;
      if (!isAllLocs) {
        const cityPart = locQuery.split(",")[0].trim();
        locMatch =
          p.location.toLowerCase().includes(locQuery) ||
          p.locationKey.toLowerCase().includes(locQuery) ||
          p.title.toLowerCase().includes(locQuery) ||
          (cityPart.length > 0 && (
            p.location.toLowerCase().includes(cityPart) ||
            p.locationKey.toLowerCase().includes(cityPart)
          ));
      }
      if (!locMatch) return false;

      // 2. Property Type match
      if (filters.type && filters.type !== "All Types") {
        const typeMatch = p.type.toLowerCase().includes(filters.type.toLowerCase()) || 
          filters.type.toLowerCase().includes(p.type.toLowerCase());
        if (!typeMatch) return false;
      }

      // 3. Price / Budget match
      if (filters.price && filters.price !== "All Prices") {
        const val = p.priceValue;
        if (filters.price === "Under $10M" && val >= 10000000) return false;
        if (filters.price === "$10M - $25M" && (val < 10000000 || val > 25000000)) return false;
        if (filters.price === "$25M - $50M" && (val < 25000000 || val > 50000000)) return false;
        if (filters.price === "$50M+" && val < 50000000) return false;
      }

      return true;
    });
  }, [allProperties, isSearched, filters]);

  return (
    <section id="featured-properties" className="py-16 sm:py-24 md:py-32 bg-[#0c0b0a] relative overflow-hidden transition-colors duration-1000">
      {/* Distinct Ambient Glows */}
      <div 
        className="absolute top-0 right-0 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] blur-[120px] sm:blur-[180px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: "var(--theme-glow-2)" }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] blur-[120px] sm:blur-[180px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: "var(--theme-glow-3)" }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 mb-8 sm:mb-16">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-light text-white mb-2 sm:mb-4">
              Featured <span className="font-medium italic" style={{ color: "var(--theme-accent)" }}>Residences</span>
            </h2>
            <p className="text-white/60 max-w-lg text-xs sm:text-sm leading-relaxed">
              {isSearched
                ? `${filtered.length} propert${filtered.length !== 1 ? "ies" : "y"} found matching your criteria.`
                : "Explore our handpicked selection of the most extraordinary properties currently available."}
            </p>
          </div>
          <Link 
            href="/properties"
            className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-white hover:text-[#c5a059] transition-colors pb-1.5 border-b border-white/20 hover:border-[#c5a059] cursor-pointer inline-flex items-center gap-1.5 group shrink-0"
          >
            <span>View All Properties</span>
            <span className="text-[#c5a059] group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* Property Grid */}
        {filtered.length === 0 ? (
          <div className="relative max-w-2xl mx-auto my-6 sm:my-10 p-8 sm:p-12 bg-[#0c0c0c]/90 backdrop-blur-2xl rounded-3xl border border-[#c5a059]/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center overflow-hidden">
            {/* Ambient luxury glow in card */}
            <div 
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[90px] pointer-events-none opacity-20"
              style={{ backgroundColor: "var(--theme-accent)" }}
            />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/40 flex items-center justify-center mb-5 text-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.2)]">
                <Compass className="w-7 h-7" />
              </div>

              <span className="text-[11px] font-semibold text-[#c5a059] uppercase tracking-[0.2em] mb-2">
                Off-Market Portfolio & Private Sourcing
              </span>

              <h3 className="text-2xl sm:text-3xl font-heading font-light text-white mb-3">
                No Active Public Listings in{" "}
                <span className="font-serif italic text-[#c5a059]">
                  {filters.location && filters.location !== "All Locations" ? `"${filters.location}"` : "This Location"}
                </span>
              </h3>

              <p className="font-luxury-serif italic text-base sm:text-lg text-white/85 max-w-lg mb-8 leading-relaxed">
                &ldquo;We currently don&apos;t have active public listings for this location. However, many of our most prestigious estates and off-market pocket listings are handled privately. Contact our private acquisitions consultant for confidential access and upcoming releases.&rdquo;
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onOpenConsultation?.(filters.location || "Off-Market Search")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#c5a059] via-[#dfba74] to-[#c5a059] text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-[#c5a059]/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Our Consultant</span>
                </button>

                {onViewAll && (
                  <button
                    type="button"
                    onClick={onViewAll}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs sm:text-sm uppercase tracking-wider font-medium hover:border-white/30 transition-all cursor-pointer"
                  >
                    View All Active Estates
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((property, idx) => (
              <div 
                key={property.id} 
                className="group relative bg-[#0f0e0d] rounded-2xl overflow-hidden border border-white/10 hover:border-[#c5a059]/60 transition-all duration-500 shadow-2xl flex flex-col justify-between"
              >
                {/* Image Media Container */}
                <div className="relative h-[260px] sm:h-[320px] md:h-[360px] overflow-hidden bg-[#111]">
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    loading="lazy"
                    quality={80}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

                  {/* Primary Residence Link covering media area */}
                  <Link 
                    href={`/properties/${property.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`View details for ${property.title}`}
                  />

                  {/* Badges & Heart Button (z-30 sits strictly above the link to guarantee 100% tap responsiveness on mobile) */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-start z-30 pointer-events-auto">
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap pointer-events-none">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-md border border-white/10">
                        {property.badge}
                      </span>
                      <span 
                        className="px-2.5 py-1 backdrop-blur-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-md border" 
                        style={{ backgroundColor: "var(--theme-glow-1)", color: "var(--theme-accent)", borderColor: "var(--theme-accent)" }}
                      >
                        {property.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleHeartClick(e, property)}
                      className={cn(
                        "relative w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 touch-manipulation",
                        isFavorite(property.id)
                          ? "bg-red-500/20 text-red-500 border border-red-500/40"
                          : "bg-black/60 text-white hover:bg-white/25 border border-white/20"
                      )}
                      aria-label={isFavorite(property.id) ? "Remove from loved homes" : "You might love this home!"}
                    >
                      {/* Expanding pulse burst ring when clicked */}
                      {animatingHeartId === property.id && (
                        <span className="absolute inset-0 rounded-full border-2 border-red-500/90 animate-heart-burst pointer-events-none" />
                      )}
                      <Heart
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          animatingHeartId === property.id && "animate-heart-pop text-red-500 fill-red-500",
                          isFavorite(property.id) && "fill-red-500 text-red-500"
                        )}
                      />
                    </button>
                  </div>

                  {/* Instagram-style floating heart pop in center of card */}
                  {animatingHeartId === property.id && (
                    <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
                      <div className="animate-heart-pop p-4 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl">
                        <Heart className="w-10 h-10 sm:w-12 sm:h-12 fill-red-500 text-red-500 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                      </div>
                    </div>
                  )}

                  {/* Desktop Hover Quick Action Overlay */}
                  <div className="hidden md:flex absolute inset-0 items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 px-4 pointer-events-none">
                    <Link
                      href={`/properties/${property.id}`}
                      className="pointer-events-auto flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-2 rounded-full text-white font-medium text-xs hover:bg-white hover:text-black transition-all shadow-lg"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View Residence</span>
                    </Link>

                    {property.virtualTourUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTourProperty(property);
                        }}
                        className="pointer-events-auto flex items-center gap-1.5 bg-gradient-to-r from-[#c5a059] to-[#dfba74] text-black font-semibold text-xs px-4 py-2 rounded-full hover:opacity-95 transition-all shadow-lg cursor-pointer touch-manipulation"
                        title="Open 3D Virtual Tour"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>3D Tour</span>
                      </button>
                    )}
                  </div>

                  {/* Mobile 3D Tour Badge on bottom-right of image (isolated from link for clean touches) */}
                  {property.virtualTourUrl && (
                    <div className="md:hidden absolute bottom-3 right-3 z-30 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTourProperty(property);
                        }}
                        className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-[#c5a059]/60 text-[#c5a059] text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg active:scale-95 touch-manipulation cursor-pointer"
                        aria-label="Open 3D Virtual Tour"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>3D Tour</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Link 
                        href={`/properties/${property.id}`}
                        className="text-lg sm:text-xl font-heading text-white hover:text-[#c5a059] transition-colors line-clamp-1"
                      >
                        {property.title}
                      </Link>
                      <div className="font-semibold text-base sm:text-lg shrink-0 transition-colors duration-1000" style={{ color: "var(--theme-accent)" }}>
                        {formatPrice(property.priceValue)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-white/50 text-xs sm:text-sm mb-4">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#c5a059]" />
                      <span className="truncate">{property.location}</span>
                    </div>
                  </div>

                  {/* Specs & Mobile View Button */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-white/60 text-xs sm:text-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-white/40" />
                        <span>{property.beds} <span className="hidden sm:inline">Beds</span></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-white/40" />
                        <span>{property.baths} <span className="hidden sm:inline">Baths</span></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Square className="w-3.5 h-3.5 text-white/40" />
                        <span>{formatArea(property.sqft)}</span>
                      </div>
                    </div>

                    {/* Mobile Direct Action Arrow */}
                    <Link
                      href={`/properties/${property.id}`}
                      className="md:hidden text-xs text-[#c5a059] font-medium flex items-center gap-0.5"
                    >
                      <span>Explore</span>
                      <span className="text-sm">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D Virtual Tour Modal */}
      {activeTourProperty?.virtualTourUrl && (
        <VirtualTourModal
          isOpen={!!activeTourProperty}
          onClose={() => setActiveTourProperty(null)}
          tourUrl={activeTourProperty.virtualTourUrl}
          propertyTitle={activeTourProperty.title}
          propertyLocation={activeTourProperty.location}
        />
      )}

      {/* Love Property Lead Capture Modal */}
      <LovePropertyModal
        isOpen={!!lovedProperty}
        onClose={() => setLovedProperty(null)}
        property={lovedProperty}
        onSaved={(id) => {
          if (!isFavorite(id)) {
            toggleFavorite(id);
          }
        }}
      />
    </section>

  );
}

