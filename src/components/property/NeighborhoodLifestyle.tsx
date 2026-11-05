"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Plane, Utensils, Anchor, Flag, ShoppingBag, Sparkles, 
  MapPin, Clock, Navigation, ExternalLink, ShieldCheck, Car
} from "lucide-react";
import { Property, LifestyleDestination } from "@/data/properties";

interface NeighborhoodLifestyleProps {
  property: Property;
  onBookTour?: () => void;
}

const CATEGORY_CONFIG = {
  aviation: { 
    label: "Private Aviation", 
    icon: Plane, 
    badgeStyle: "bg-sky-950/80 border-sky-400/40 text-sky-300",
    pillActive: "bg-sky-400 text-black",
    iconColor: "text-sky-400"
  },
  dining: { 
    label: "Michelin Dining", 
    icon: Utensils, 
    badgeStyle: "bg-amber-950/80 border-amber-400/40 text-amber-300",
    pillActive: "bg-amber-400 text-black",
    iconColor: "text-amber-400"
  },
  yachting: { 
    label: "Yachting & Coastal", 
    icon: Anchor, 
    badgeStyle: "bg-teal-950/80 border-teal-400/40 text-teal-300",
    pillActive: "bg-teal-400 text-black",
    iconColor: "text-teal-400"
  },
  golf: { 
    label: "Championship Golf", 
    icon: Flag, 
    badgeStyle: "bg-emerald-950/80 border-emerald-400/40 text-emerald-300",
    pillActive: "bg-emerald-400 text-black",
    iconColor: "text-emerald-400"
  },
  shopping: { 
    label: "Haute Couture", 
    icon: ShoppingBag, 
    badgeStyle: "bg-purple-950/80 border-purple-400/40 text-purple-300",
    pillActive: "bg-purple-400 text-black",
    iconColor: "text-purple-400"
  },
  wellness: { 
    label: "Private Member Clubs", 
    icon: Sparkles, 
    badgeStyle: "bg-[#2a2114]/90 border-[#c5a059]/40 text-[#dfc38a]",
    pillActive: "bg-[#c5a059] text-black",
    iconColor: "text-[#c5a059]"
  },
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  aviation: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=75",
  dining: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=75",
  yachting: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=75",
  golf: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=75",
  shopping: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=75",
  wellness: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=75"
};

function DestinationCard({ 
  dest, 
  propertyLocation, 
  priority 
}: { 
  dest: LifestyleDestination; 
  propertyLocation: string; 
  priority: boolean; 
}) {
  const fallbackImg = CATEGORY_FALLBACK_IMAGES[dest.category] || CATEGORY_FALLBACK_IMAGES.wellness;
  const [imgSrc, setImgSrc] = useState<string>(dest.image || fallbackImg);
  const [hasError, setHasError] = useState(false);

  const config = CATEGORY_CONFIG[dest.category] || CATEGORY_CONFIG.wellness;
  const Icon = config.icon;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    propertyLocation
  )}&destination=${encodeURIComponent(dest.name)}`;

  return (
    <div className="group rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#c5a059]/40 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/60 flex flex-col justify-between">
      {/* Photo Hero Banner */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-black/50">
        <Image
          src={imgSrc}
          alt={dest.name}
          fill
          className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          onError={() => {
            if (!hasError) {
              setHasError(true);
              setImgSrc(fallbackImg);
            }
          }}
        />

        {/* Dark Vignette Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/40 to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          {/* Driving Time Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#c5a059]/50 text-[#c5a059] font-mono font-semibold text-xs shadow-lg">
            <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>{dest.time}</span>
          </div>

          {/* Category Pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md border ${config.badgeStyle} shadow-lg`}>
            <Icon className="w-3 h-3" />
            <span>{config.label}</span>
          </span>
        </div>

        {/* Title overlay on bottom of image */}
        <div className="absolute bottom-3 inset-x-4">
          <h4 className="text-lg font-heading font-medium text-white group-hover:text-[#c5a059] transition-colors drop-shadow-md">
            {dest.name}
          </h4>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
          {dest.highlight}
        </p>

        {/* Card Footer: Distance & Google Maps Chauffeur Route */}
        <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/50 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="font-mono text-[11px] text-white/70">{dest.distance} from estate</span>
          </span>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#c5a059] text-[#c5a059] hover:text-black border border-white/10 hover:border-[#c5a059] transition-all font-medium group/btn cursor-pointer"
          >
            <span>Chauffeur Route</span>
            <ExternalLink className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function NeighborhoodLifestyle({ property, onBookTour }: NeighborhoodLifestyleProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const neighborhood = property.neighborhood;

  if (!neighborhood || !neighborhood.destinations) {
    return null;
  }

  const destinations = neighborhood.destinations;
  const filtered = activeCategory === "all"
    ? destinations
    : destinations.filter((d) => d.category === activeCategory);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#c5a059] font-medium mb-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>Prime Location & Proximity</span>
          </div>
          <h3 className="text-2xl font-heading text-white font-light">
            Neighborhood & Private Lifestyle
          </h3>
          <p className="text-sm text-white/60 mt-1 max-w-xl leading-relaxed">
            {neighborhood.summary}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 self-start md:self-auto backdrop-blur-md">
          <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
          <span className="font-medium text-white">{neighborhood.district}</span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeCategory === "all"
              ? "bg-[#c5a059] text-black shadow-md font-semibold"
              : "bg-white/5 border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
          }`}
        >
          All Key Milestones ({destinations.length})
        </button>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = destinations.filter(d => d.category === key).length;
          if (count === 0) return null;
          const Icon = config.icon;
          const isActive = activeCategory === key;

          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#c5a059] text-black shadow-md font-semibold"
                  : "bg-white/5 border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : config.iconColor}`} />
              <span>{config.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-black/20 text-black font-semibold" : "bg-white/10 text-white/50"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Destination Driving Time Cards Grid with Rich Photography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((dest, idx) => (
          <DestinationCard 
            key={`${dest.name}-${idx}`} 
            dest={dest} 
            propertyLocation={property.location} 
            priority={idx < 2} 
          />
        ))}
      </div>

      {/* Proximity Summary Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-white/[0.04] via-[#c5a059]/10 to-white/[0.02] border border-[#c5a059]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#c5a059] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Confidential Executive Transfers Available</span>
          </div>
          <p className="text-xs text-white/70 max-w-lg">
            Helicopter charters and armored chauffeur escorts can be coordinated directly for property viewings from any regional private airport.
          </p>
        </div>

        {onBookTour && (
          <button
            onClick={onBookTour}
            className="px-6 py-3 rounded-full bg-[#c5a059] text-black font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-lg shrink-0"
          >
            Arrange Private Itinerary
          </button>
        )}
      </div>
    </div>
  );
}
