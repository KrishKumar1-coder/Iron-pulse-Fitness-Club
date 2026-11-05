"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, 
  Layers, Compass, Ruler, FileText, Check, X, Sparkles
} from "lucide-react";
import { Property } from "@/data/properties";
import { useCurrency } from "@/context/CurrencyContext";

interface FloorPlanViewerProps {
  property: Property;
  onRequestCadDossier?: () => void;
}

export function FloorPlanViewer({ property, onRequestCadDossier }: FloorPlanViewerProps) {
  const { unit, formatArea } = useCurrency();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<string>("All Levels");
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Extract unique levels from dimensions
  const levels = ["All Levels", ...Array.from(new Set(property.dimensions?.map(d => d.level).filter(Boolean) as string[]))];

  const filteredDimensions = activeLevel === "All Levels" 
    ? property.dimensions 
    : property.dimensions.filter(d => d.level === activeLevel);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = property.floorPlanUrl;
    link.download = `Aurelia-${property.title.replace(/\s+/g, "-")}-Architectural-Blueprint.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#c5a059] font-medium mb-1">
            <Ruler className="w-3.5 h-3.5" />
            <span>Architectural CAD Blueprint</span>
          </div>
          <h3 className="text-2xl font-heading text-white font-light">
            Master Floor Plan & Dimensions
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Official scaled layout plan for {property.title} • {formatArea(property.sqft)} total residence area.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all cursor-pointer"
            title="Download high-resolution blueprint image"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isCopied ? "Downloaded" : "Download Blueprint"}</span>
          </button>

          {onRequestCadDossier && (
            <button
              onClick={onRequestCadDossier}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba74] text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Request Full CAD Dossier</span>
            </button>
          )}
        </div>
      </div>

      {/* Blueprint Canvas Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-[#080808] shadow-2xl group">
        {/* Subtle Architectural Grid Background Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        />

        {/* Corner Coordinate Badges */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase tracking-widest text-[#c5a059]">
            CAD-REF: {property.id}.00-REV
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/60">
            SCALE: 1:100
          </span>
        </div>

        {/* Canvas Toolbar (Zoom, Fullscreen, Reset) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-xl border border-white/15 rounded-xl p-1 shadow-2xl">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-white/80 px-1 min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset to 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
          <button
            onClick={() => setIsFullscreen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#c5a059] hover:bg-[#c5a059]/15 transition-colors cursor-pointer"
            title="Fullscreen Blueprint View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Blueprint Viewer Area */}
        <div className="relative w-full h-[450px] sm:h-[540px] flex items-center justify-center overflow-hidden p-6 select-none cursor-grab active:cursor-grabbing">
          <div 
            className="relative w-full h-full max-w-4xl max-h-[92%] transition-transform duration-300 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <Image
              src={property.floorPlanUrl}
              alt={`${property.title} Architectural Floor Plan`}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-contain filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>

        {/* Bottom Status & Scale Bar */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-wrap items-center justify-between text-xs text-white/60 gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-white/80">Vector CAD Blueprint Loaded</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-white/40">UNITS: {unit.toUpperCase()}</span>
            <span className="text-white/40">|</span>
            <span className="text-[#c5a059]">AUTHENTIC ARCHITECTURAL ASSET</span>
          </div>
        </div>
      </div>

      {/* Level Filter Tabs (if multiple levels exist) */}
      {levels.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs uppercase tracking-wider text-white/40 font-medium mr-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Select Level:</span>
          </span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeLevel === lvl
                  ? "bg-[#c5a059] text-black shadow-md font-semibold"
                  : "bg-white/5 border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {/* Room Dimensions & Specifications Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-heading text-white font-light">
            Verified Room Specifications
          </h4>
          <span className="text-xs text-white/40 font-mono">
            {filteredDimensions.length} Key Living Spaces
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDimensions.map((dim, i) => {
            const isHovered = hoveredRoom === dim.room;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredRoom(dim.room)}
                onMouseLeave={() => setHoveredRoom(null)}
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isHovered
                    ? "bg-[#c5a059]/10 border-[#c5a059] shadow-lg shadow-[#c5a059]/10 translate-y-[-2px]"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-white group-hover:text-[#c5a059] transition-colors">
                    {dim.room}
                  </span>
                  {dim.level && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-mono text-white/50">
                      {dim.level}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-white/40">Dimensions</span>
                  <span className="font-mono text-sm font-medium text-[#c5a059]">
                    {dim.size}
                  </span>
                </div>

                {dim.sqft && (
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[11px] text-white/30">Calculated Area</span>
                    <span className="text-xs text-white/70 font-mono">
                      {formatArea(dim.sqft.toString())}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Blueprint Inspection Studio Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex flex-col p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between pb-4 border-b border-white/10 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-xs uppercase tracking-widest text-[#c5a059] font-mono">
                CAD INSPECTION STUDIO
              </span>
              <h3 className="text-xl font-heading text-white">{property.title} — Blueprint</h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Image</span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Fullscreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Image Canvas */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-auto p-4 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="relative w-full h-full max-w-6xl max-h-[90vh] transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <Image
                src={property.floorPlanUrl}
                alt={`${property.title} Blueprint Fullscreen`}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>

          {/* Floating Controls at Bottom */}
          <div 
            className="flex items-center justify-center gap-3 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 bg-[#111] border border-white/20 rounded-full px-4 py-2 shadow-2xl text-white">
              <button onClick={handleZoomOut} className="p-1 hover:text-[#c5a059] transition-colors cursor-pointer">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomIn} className="p-1 hover:text-[#c5a059] transition-colors cursor-pointer">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleResetZoom} className="p-1 hover:text-[#c5a059] transition-colors cursor-pointer ml-1">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
