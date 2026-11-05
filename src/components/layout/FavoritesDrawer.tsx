"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Heart, ArrowRight, MessageSquare, BedDouble, Bath, Square } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import { useCurrency } from "@/context/CurrencyContext";
import { properties } from "@/data/properties";

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesDrawer({ isOpen, onClose }: FavoritesDrawerProps) {
  const { favorites, toggleFavorite, clearFavorites, favoriteCount } = useFavorites();
  const { formatPrice, formatArea } = useCurrency();

  // Freeze background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter properties in favorites
  const savedProperties = properties.filter((p) => favorites.includes(p.id));

  // Build WhatsApp inquiry text for all saved residences
  const buildWhatsAppLink = () => {
    const phone = "13108994000";
    const propertyList = savedProperties
      .map((p, idx) => `${idx + 1}. ${p.title} (${p.location}) - ${formatPrice(p.priceValue)}`)
      .join("%0A");
    const text = `Hello Aurelia Luxury Estates, I have shortlisted ${savedProperties.length} residences on your website and would like to arrange private consultations:%0A%0A${propertyList}`;
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-md bg-[#0d0d0d] border-l border-white/10 shadow-2xl h-[100dvh] flex flex-col z-10 text-white overflow-hidden animate-slide-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Heart className="w-4 h-4 fill-[#c5a059]" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-light tracking-wide text-white">
                Saved Homes
              </h2>
              <p className="text-xs text-white/50">
                {favoriteCount} {favoriteCount === 1 ? "residence" : "residences"} shortlisted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer touch-manipulation active:scale-90"
            aria-label="Close Shortlist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedProperties.length === 0 ? (
            <div className="text-center py-20 px-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-medium text-white">Your shortlist is empty</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                Click the heart icon on any property to save your favorite villas and compare them here.
              </p>
            </div>
          ) : (
            savedProperties.map((property) => (
              <div
                key={property.id}
                className="group relative bg-white/[0.03] border border-white/10 hover:border-[#c5a059]/40 rounded-xl overflow-hidden p-3 flex gap-4 transition-all"
              >
                {/* Image */}
                <Link
                  href={`/properties/${property.id}`}
                  onClick={onClose}
                  className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-[#1a1a1a]"
                >
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/properties/${property.id}`}
                        onClick={onClose}
                        className="font-heading text-sm text-white hover:text-[#c5a059] transition-colors truncate block"
                      >
                        {property.title}
                      </Link>
                      <button
                        onClick={() => toggleFavorite(property.id)}
                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                        title="Remove from shortlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-white/50 truncate">{property.location}</p>
                    <p className="text-sm font-semibold text-[#c5a059] mt-1">
                      {formatPrice(property.priceValue)}
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="flex items-center gap-3 text-[10px] text-white/50 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3 h-3" />
                      {property.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      {property.baths}
                    </span>
                    <span className="flex items-center gap-1">
                      <Square className="w-3 h-3" />
                      {formatArea(property.sqft)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {savedProperties.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/60 space-y-3">
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-[#25D366] to-[#1ebd59] text-black font-semibold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity shadow-lg touch-manipulation active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>Inquire via WhatsApp</span>
            </a>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={clearFavorites}
                className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                Clear all ({favoriteCount})
              </button>
              <button
                onClick={onClose}
                className="text-xs text-[#c5a059] hover:underline cursor-pointer flex items-center gap-1"
              >
                Continue Browsing
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
