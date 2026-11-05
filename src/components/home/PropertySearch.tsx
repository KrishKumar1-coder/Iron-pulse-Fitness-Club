"use client";

import { useRef, useEffect } from "react";
import { Search, ChevronDown, MapPin, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { PropertyFilters, DROPDOWN_OPTIONS } from "@/types/filters";

type FilterKey = "location" | "type" | "price" | "beds" | "baths";

interface Props {
  filters: PropertyFilters;
  activeFilter: FilterKey | null;
  onFilterChange: (key: keyof PropertyFilters, value: string) => void;
  onToggleFilter: (key: FilterKey) => void;
  onSearch: () => void;
}

export function PropertySearch({
  filters,
  activeFilter,
  onFilterChange,
  onToggleFilter,
  onSearch,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLocationOpen = activeFilter === "location";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (activeFilter) {
          onToggleFilter(activeFilter);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [activeFilter, onToggleFilter]);

  const selectedLocation =
    filters.location && filters.location !== "All Locations"
      ? filters.location
      : "Browse Prime Locations";

  return (
    <div 
      ref={containerRef} 
      data-prevent-swipe="true"
      className="relative z-40 max-w-2xl mx-auto w-full px-3 sm:px-4 my-2 sm:my-3"
    >
      {/* Main Luxury Glass Capsule - Clean, Minimalist Browse Bar */}
      <div className="bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-2xl transition-all">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          
          {/* Browse Selector & Upward Dropdown */}
          <div className="relative flex-1 w-full">
            <button
              type="button"
              onClick={() => onToggleFilter("location")}
              className={cn(
                "w-full flex items-center justify-between bg-white/[0.05] hover:bg-white/[0.09] border rounded-xl sm:rounded-full px-4 sm:px-5 py-3 transition-all cursor-pointer text-left touch-manipulation min-h-[48px]",
                isLocationOpen ? "border-[#c5a059] bg-white/[0.10]" : "border-white/10"
              )}
              aria-expanded={isLocationOpen}
              aria-label="Browse prime locations"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#c5a059]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-white/50">
                    Location
                  </span>
                  <span className="text-sm sm:text-base font-medium text-white truncate">
                    {selectedLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider hidden xs:inline">
                  Browse
                </span>
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[#c5a059] transition-transform duration-300",
                      isLocationOpen && "rotate-180"
                    )}
                  />
                </div>
              </div>
            </button>

            {/* Location Dropdown Menu - Opens UPWARD into the hero view so it is NEVER hidden or clipped */}
            {isLocationOpen && (
              <div
                data-lenis-prevent="true"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                className="absolute bottom-full left-0 right-0 mb-3 z-[100] bg-[#0e0e11]/98 backdrop-blur-3xl rounded-2xl overflow-hidden shadow-[0_-16px_50px_rgba(0,0,0,0.9)] border border-white/20 max-h-72 overflow-y-auto divide-y divide-white/5 animate-fade-in"
                style={{ overscrollBehavior: "contain" }}
              >
                <div className="px-4 py-2.5 bg-white/[0.04] text-[10px] sm:text-xs font-semibold text-[#c5a059] uppercase tracking-widest flex items-center justify-between">
                  <span>Featured Prime Markets</span>
                  <span className="text-[10px] text-white/40 normal-case tracking-normal">Select location</span>
                </div>
                {DROPDOWN_OPTIONS.location.map((opt) => {
                  const isSelected =
                    filters.location === opt ||
                    (opt === "All Locations" && (!filters.location || filters.location === "All Locations"));
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onFilterChange("location", opt);
                        onToggleFilter("location");
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3.5 text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer group touch-manipulation min-h-[44px]",
                        isSelected
                          ? "bg-[#c5a059]/20 text-[#c5a059] font-medium"
                          : "text-white/80 hover:text-white hover:bg-white/[0.06] active:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <MapPin
                          className={cn(
                            "w-3.5 h-3.5 shrink-0 transition-colors",
                            isSelected ? "text-[#c5a059]" : "text-white/30 group-hover:text-[#c5a059]"
                          )}
                        />
                        <span className="truncate">{opt}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#c5a059] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Button (Standard solid gold matching all site buttons) */}
          <button
            type="button"
            onClick={onSearch}
            className="w-full sm:w-auto sm:min-w-[160px] min-h-[48px] sm:min-h-[52px] px-7 text-black font-semibold text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-full flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 shadow-md touch-manipulation hover:opacity-95"
            style={{
              backgroundColor: "var(--theme-accent)",
              transition: "background-color 1.2s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s ease, box-shadow 0.2s ease"
            }}
          >
            <Search className="w-4 h-4" />
            <span>Search Estates</span>
          </button>

        </div>
      </div>
    </div>
  );
}
