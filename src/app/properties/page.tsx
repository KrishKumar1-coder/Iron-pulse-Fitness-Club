"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Heart, Maximize2, BedDouble, Bath, Square, MapPin, 
  Search, SlidersHorizontal, ArrowLeft, ArrowUpDown, Check
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { properties, Property } from "@/data/properties";
import { useCurrency } from "@/context/CurrencyContext";
import { useFavorites } from "@/context/FavoritesContext";
import { cn } from "@/utils/cn";

// Code-split modals
const VirtualTourModal = dynamic(
  () => import("@/components/layout/VirtualTourModal").then((m) => m.VirtualTourModal),
  { ssr: false }
);
const LovePropertyModal = dynamic(
  () => import("@/components/layout/LovePropertyModal").then((m) => m.LovePropertyModal),
  { ssr: false }
);

type SortOption = "featured" | "price-desc" | "price-asc" | "sqft-desc";

const LOCATIONS = [
  "All Locations",
  "Beverly Hills, CA",
  "Malibu, CA",
  "Hollywood Hills, CA",
  "Miami Beach, FL",
  "Aspen, CO",
  "New York, NY",
];

const TYPES = ["All Types", "Mansion", "Estate", "Modern Home", "Chalet", "Penthouse"];

export default function AllPropertiesPage() {
  const { formatPrice, formatArea } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [allProperties, setAllProperties] = useState<Property[]>(properties);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedType, setSelectedType] = useState("All Types");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

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

    setAnimatingHeartId(prop.id);
    toggleFavorite(prop.id);

    setTimeout(() => {
      setAnimatingHeartId(null);
      setLovedProperty(prop);
    }, 750);
  };

  const filteredProperties = useMemo(() => {
    return allProperties
      .filter((p) => {
        const matchesSearch =
          searchQuery.trim() === "" ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation =
          selectedLocation === "All Locations" || p.locationKey === selectedLocation;

        const matchesType =
          selectedType === "All Types" || p.type === selectedType;

        return matchesSearch && matchesLocation && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "price-desc") return b.priceValue - a.priceValue;
        if (sortBy === "price-asc") return a.priceValue - b.priceValue;
        if (sortBy === "sqft-desc") {
          const sqftA = parseInt(a.sqft.replace(/,/g, ""), 10) || 0;
          const sqftB = parseInt(b.sqft.replace(/,/g, ""), 10) || 0;
          return sqftB - sqftA;
        }
        return a.id - b.id; // default featured
      });
  }, [searchQuery, selectedLocation, selectedType, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedLocation("All Locations");
    setSelectedType("All Types");
    setSortBy("featured");
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Ambient background glow */}
      <div 
        className="absolute top-20 right-10 w-[700px] h-[700px] blur-[200px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(197, 160, 89, 0.12)" }}
      />
      <div 
        className="absolute top-96 -left-32 w-[600px] h-[600px] blur-[180px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(217, 155, 78, 0.08)" }}
      />

      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 relative z-10 flex-1 max-w-7xl">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group text-xs uppercase tracking-widest font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <span className="text-xs uppercase tracking-widest text-[#c5a059] font-medium font-mono">
            {filteredProperties.length} {filteredProperties.length === 1 ? "Residence" : "Residences"} Available
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-light text-white mb-3 sm:mb-4 tracking-tight">
            All Curated <span className="italic font-medium text-[#c5a059]">Residences</span>
          </h1>
          <p className="text-white/60 max-w-2xl text-xs sm:text-base leading-relaxed font-light">
            Explore our comprehensive portfolio of premier private estates, oceanfront compounds, and architectural penthouses worldwide.
          </p>
        </div>

        {/* Search, Filter & Sort Control Bar */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl mb-8 sm:mb-12 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="sm:col-span-2 md:col-span-5 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search estates, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#c5a059]/60 transition-colors"
              />
            </div>

            {/* Location Selector */}
            <div className="sm:col-span-1 md:col-span-3">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#c5a059]/60 transition-colors cursor-pointer"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-[#111] text-white">
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type Selector */}
            <div className="sm:col-span-1 md:col-span-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#c5a059]/60 transition-colors cursor-pointer"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#111] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-2 md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#c5a059]/60 transition-colors cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="sqft-desc">Area: Largest First</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills / Reset */}
          {(searchQuery || selectedLocation !== "All Locations" || selectedType !== "All Types") && (
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/5 text-xs gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/40">Active Filters:</span>
                {searchQuery && (
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
                {selectedLocation !== "All Locations" && (
                  <span className="px-2.5 py-1 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059]">
                    {selectedLocation}
                  </span>
                )}
                {selectedType !== "All Types" && (
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                    {selectedType}
                  </span>
                )}
              </div>

              <button
                onClick={resetAllFilters}
                className="text-white/50 hover:text-[#c5a059] transition-colors underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16 sm:py-24 p-6 sm:p-12 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <p className="text-white/40 text-xl sm:text-2xl font-heading font-light">
              No residences match your current criteria.
            </p>
            <p className="text-white/30 text-xs sm:text-sm">
              Try adjusting your search terms, location, or property type filters.
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#c5a059] text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map((property, idx) => (
              <div
                key={property.id}
                className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 hover:border-[#c5a059]/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                {/* Image Media Container */}
                <div className="relative h-[260px] sm:h-[320px] md:h-[360px] overflow-hidden bg-black/50">
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    priority={idx < 2}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/30 to-black/20 pointer-events-none" />

                  {/* Primary Link covering image area */}
                  <Link 
                    href={`/properties/${property.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`View details for ${property.title}`}
                  />

                  {/* Badges & Heart Button (z-30 sits strictly above link to guarantee tap responsiveness on mobile) */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-start z-30 pointer-events-auto">
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap pointer-events-none">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider rounded-lg border border-white/10">
                        {property.badge}
                      </span>
                      <span className="px-2.5 py-1 bg-[#c5a059]/20 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider rounded-lg border border-[#c5a059]/40 text-[#c5a059]">
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
                          : "bg-black/50 text-white hover:bg-white/25 border border-white/15"
                      )}
                      aria-label={isFavorite(property.id) ? "Remove from loved homes" : "You might love this home!"}
                    >
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

                  {/* Floating Center Heart Pop */}
                  {animatingHeartId === property.id && (
                    <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
                      <div className="animate-heart-pop p-4 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl">
                        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 fill-red-500" />
                      </div>
                    </div>
                  )}

                  {/* 3D Tour Overlay Pill (z-30 pointer-events-auto touch-manipulation) */}
                  {property.virtualTourUrl && (
                    <div className="absolute bottom-3 right-3 z-30 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveTourProperty(property);
                        }}
                        className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 hover:border-[#c5a059] text-xs text-white hover:text-[#c5a059] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg active:scale-95 touch-manipulation"
                        aria-label="Open 3D Virtual Tour"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>3D Tour</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </div>

                    <Link href={`/properties/${property.id}`} className="group-hover:text-[#c5a059] transition-colors">
                      <h3 className="text-lg sm:text-xl font-heading font-medium text-white mb-2 leading-snug line-clamp-1">
                        {property.title}
                      </h3>
                    </Link>

                    <p className="text-xl sm:text-2xl font-mono font-light text-[#c5a059]">
                      {formatPrice(property.priceValue)}
                    </p>
                  </div>

                  {/* Amenities Row */}
                  <div className="pt-3 sm:pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-white/40" />
                      <span>{property.beds} <span className="hidden sm:inline">Beds</span></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-white/40" />
                      <span>{property.baths} <span className="hidden sm:inline">Baths</span></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Square className="w-3.5 h-3.5 text-white/40" />
                      <span>{formatArea(property.sqft)}</span>
                    </span>
                  </div>

                  {/* Details Link CTA */}
                  <div className="pt-2">
                    <Link
                      href={`/properties/${property.id}`}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#c5a059] text-white/80 hover:text-black border border-white/10 hover:border-[#c5a059] transition-all text-xs font-semibold uppercase tracking-wider text-center block cursor-pointer active:scale-95"
                    >
                      Inspect Residence
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Modals */}
      <VirtualTourModal
        isOpen={!!activeTourProperty}
        onClose={() => setActiveTourProperty(null)}
        tourUrl={activeTourProperty?.virtualTourUrl || "https://my.matterport.com/show/?m=JGPnGdaPdRenderer&play=1"}
        propertyTitle={activeTourProperty?.title || ""}
        propertyLocation={activeTourProperty?.location}
      />

      <LovePropertyModal
        property={lovedProperty}
        isOpen={!!lovedProperty}
        onClose={() => setLovedProperty(null)}
      />
    </main>
  );
}
