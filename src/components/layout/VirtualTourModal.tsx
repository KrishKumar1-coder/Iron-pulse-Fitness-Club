"use client";

import { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, Compass, Sparkles, MapPin } from "lucide-react";

interface VirtualTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourUrl: string;
  propertyTitle: string;
  propertyLocation?: string;
  onBookTour?: () => void;
}

export function VirtualTourModal({
  isOpen,
  onClose,
  tourUrl,
  propertyTitle,
  propertyLocation,
  onBookTour,
}: VirtualTourModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Lock body scroll with Lenis when modal is open without resetting scrollY
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      setIsLoading(true);
    } else {
      document.body.classList.remove("modal-open");
      setIsFullscreen(false);
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen || !tourUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in overscroll-none"
      onClick={onClose}
    >
      <div
        data-lenis-prevent="true"
        className={`relative w-full bg-[#0a0a0a] border border-[#c5a059]/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300 ${
          isFullscreen ? "h-[98dvh] max-w-[98vw]" : "h-[88dvh] sm:h-[85vh] max-w-5xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-heading font-medium tracking-wide text-white truncate max-w-[160px] sm:max-w-md">
                  {propertyTitle}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-[#c5a059] text-black shrink-0">
                  3D Walkthrough
                </span>
              </div>
              {propertyLocation && (
                <p className="text-[11px] sm:text-xs text-white/50 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#c5a059] shrink-0" />
                  <span className="truncate">{propertyLocation}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer touch-manipulation active:scale-90"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer touch-manipulation active:scale-90"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="relative flex-1 w-full bg-[#050505]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070707] space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#c5a059] border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-white">Loading 3D Digital Twin...</p>
                <p className="text-xs text-white/40">Calibrating interior rooms and camera angles</p>
              </div>
            </div>
          )}

          <iframe
            src={tourUrl}
            title={`${propertyTitle} 3D Tour`}
            className="w-full h-full border-0"
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Helper Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-white/10 bg-white/[0.02] gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>
              <strong>Tip:</strong> Click the circles on the floor to walk &bull; Click and drag to look 360&deg; &bull; Scroll to zoom
            </span>
          </div>

          {onBookTour && (
            <button
              onClick={() => {
                onClose();
                onBookTour();
              }}
              className="px-4 py-1.5 rounded-full bg-[#c5a059] text-black font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow"
            >
              Book In-Person Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
