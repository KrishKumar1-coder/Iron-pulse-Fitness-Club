"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Menu, X, ChevronDown, Check, Lock, Heart } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCurrency, CURRENCIES, AreaUnit } from "@/context/CurrencyContext";
import { useFavorites } from "@/context/FavoritesContext";
import { scrollToTarget } from "@/utils/scrollTo";

// Code-split modals and drawers so they load on demand
const VipViewingModal = dynamic(
  () => import("@/components/layout/VipViewingModal").then((m) => m.VipViewingModal),
  { ssr: false }
);
const FavoritesDrawer = dynamic(
  () => import("@/components/layout/FavoritesDrawer").then((m) => m.FavoritesDrawer),
  { ssr: false }
);

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  const { currency, setCurrency, unit, setUnit, currentCurrencyConfig } = useCurrency();
  const { favoriteCount } = useFavorites();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and Lenis when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const currenciesList = Object.values(CURRENCIES);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isScrolled
          ? "bg-black/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl"
          : "bg-gradient-to-b from-black/85 via-black/40 to-transparent py-4 sm:py-5"
      )}
    >
      <div className="container mx-auto px-3 sm:px-6 flex items-center justify-between max-w-7xl">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.location.pathname === "/") {
              e.preventDefault();
              scrollToTarget(0, 0);
            }
          }}
          className="group flex items-center gap-1 text-lg sm:text-2xl font-heading font-light tracking-widest text-white cursor-pointer select-none shrink-0"
        >
          <span>AURELIA</span>
          <span 
            className="w-1.5 h-1.5 rounded-full inline-block transition-transform duration-300 group-hover:scale-150" 
            style={{ backgroundColor: "var(--theme-accent, #c5a059)" }}
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {[
            { name: "Properties", href: "/#featured-properties", id: "featured-properties" },
            { name: "About", href: "/#about", id: "about" },
            { name: "Reviews", href: "/#testimonials", id: "testimonials" },
            { name: "Location", href: "/#location", id: "location" },
            { name: "Contact", href: "/#contact", id: "contact" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (typeof window !== "undefined" && window.location.pathname === "/") {
                  e.preventDefault();
                  scrollToTarget(item.id, -80);
                }
              }}
              className="text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white hover:tracking-[0.25em] transition-all duration-300 font-medium cursor-pointer whitespace-nowrap"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop & Tablet Controls */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
          {/* Currency & Unit Selector Dropdown */}
          <div className="relative" ref={currencyDropdownRef}>
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#c5a059]/50 text-xs font-medium text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md"
              title="Change Currency & Measurement Units"
            >
              <span className="text-sm">{currentCurrencyConfig.flag}</span>
              <span className="font-semibold" style={{ color: "var(--theme-accent, #c5a059)" }}>{currentCurrencyConfig.code}</span>
              <span className="text-white/40">|</span>
              <span className="uppercase text-[10px] tracking-wider text-white/70">
                {unit === "sqft" ? "Sq Ft" : "m²"}
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-white/40 transition-transform duration-300",
                  isCurrencyOpen && "rotate-180 text-[#c5a059]"
                )}
              />
            </button>

            {/* Desktop Dropdown Menu */}
            {isCurrencyOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0c0c0c]/95 border border-white/15 shadow-2xl backdrop-blur-2xl p-3 z-50 animate-fade-in text-white">
                {/* Currency Section */}
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold px-2 mb-1.5">
                    Select Currency
                  </p>
                  <div className="space-y-1">
                    {currenciesList.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code);
                          setIsCurrencyOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left",
                          currency === c.code
                            ? "bg-[#c5a059]/15 text-[#c5a059] font-medium"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{c.flag}</span>
                          <span>{c.code}</span>
                          <span className="text-[11px] text-white/40">({c.symbol})</span>
                        </div>
                        {currency === c.code && <Check className="w-3.5 h-3.5 text-[#c5a059]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit Switcher */}
                <div className="pt-2.5 border-t border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold px-2 mb-1.5">
                    Measurement Unit
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/5">
                    {(
                      [
                        { key: "sqft", label: "Square Feet" },
                        { key: "sqm", label: "Square Meters (m²)" },
                      ] as const
                    ).map((u) => (
                      <button
                        key={u.key}
                        onClick={() => setUnit(u.key as AreaUnit)}
                        className={cn(
                          "py-1.5 px-2 rounded text-[11px] font-medium transition-all cursor-pointer text-center",
                          unit === u.key
                            ? "bg-[#c5a059] text-black shadow"
                            : "text-white/60 hover:text-white"
                        )}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Saved Homes / Shortlist Desktop Trigger */}
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(true)}
            className="relative p-2 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#c5a059]/50 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shrink-0"
            title="Shortlisted Residences"
            aria-label="Shortlisted Residences"
          >
            <Heart className={cn("w-4 h-4 transition-colors", favoriteCount > 0 ? "fill-red-500 text-red-500" : "text-white/70")} />
            {favoriteCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* Book Tour CTA (Prominently styled, always visible on Desktop & Tablet) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 px-5 py-2.5 rounded-full text-black text-xs font-semibold uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer whitespace-nowrap"
            style={{ 
              backgroundColor: "var(--theme-accent, #c5a059)",
              transition: "background-color 1.2s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s"
            }}
          >
            Book a Tour
          </button>
        </div>

        {/* Mobile Header Actions (Always visible top right corner on Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden shrink-0">
          {/* Mobile Quick Currency Trigger */}
          <div className="relative" ref={currencyDropdownRef}>
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-medium cursor-pointer active:scale-95 transition-all touch-manipulation min-h-[36px]"
              aria-label="Currency and Unit"
            >
              <span className="text-sm">{currentCurrencyConfig.flag}</span>
              <span className="font-semibold text-[11px]" style={{ color: "var(--theme-accent, #c5a059)" }}>{currentCurrencyConfig.code}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform text-white/50", isCurrencyOpen && "rotate-180")} />
            </button>

            {/* Mobile Currency Dropdown Popover */}
            {isCurrencyOpen && (
              <div 
                data-lenis-prevent="true"
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0e0e0e]/98 border border-white/15 shadow-2xl backdrop-blur-2xl p-3 z-50 text-white animate-fade-in"
              >
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold px-2 mb-2">Currency</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {currenciesList.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setIsCurrencyOpen(false);
                      }}
                      className={cn(
                        "p-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1 touch-manipulation min-h-[38px]",
                        currency === c.code
                          ? "border-[#c5a059] bg-[#c5a059]/15 text-[#c5a059]"
                          : "border-white/10 text-white/70 hover:bg-white/5"
                      )}
                    >
                      <span>{c.flag}</span>
                      <span>{c.code}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold px-2 mb-2 pt-2 border-t border-white/10">Unit</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["sqft", "sqm"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setUnit(u);
                        setIsCurrencyOpen(false);
                      }}
                      className={cn(
                        "py-2 px-2 rounded-lg text-[11px] font-medium border text-center transition-all touch-manipulation min-h-[38px]",
                        unit === u
                          ? "border-[#c5a059] bg-[#c5a059] text-black"
                          : "border-white/10 text-white/70"
                      )}
                    >
                      {u === "sqft" ? "Sq Ft" : "m²"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Favorites Button */}
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(true)}
            className="relative w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer touch-manipulation"
            title="Saved Residences"
            aria-label="Saved Residences"
          >
            <Heart className={cn("w-4 h-4", favoriteCount > 0 ? "fill-red-500 text-red-500" : "text-white/70")} />
            {favoriteCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-white rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation z-50 pointer-events-auto"
            onClick={() => {
              setIsMenuOpen((prev) => !prev);
              setIsCurrencyOpen(false);
            }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5 text-[#c5a059]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div
          data-lenis-prevent="true"
          className="md:hidden bg-[#0a0a0a]/98 backdrop-blur-3xl border-b border-white/15 px-5 py-6 space-y-6 animate-fade-in max-h-[calc(100dvh-64px)] overflow-y-auto"
          style={{ overscrollBehavior: "contain" }}
        >
          <nav className="flex flex-col gap-3">
            {[
              { name: "Featured Properties", href: "/#featured-properties", id: "featured-properties" },
              { name: "About Aurelia", href: "/#about", id: "about" },
              { name: "Client Reviews", href: "/#testimonials", id: "testimonials" },
              { name: "Beverly Hills Office", href: "/#location", id: "location" },
              { name: "Contact & Advisory", href: "/#contact", id: "contact" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="py-2.5 px-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 active:bg-white/10 uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  if (typeof window !== "undefined" && window.location.pathname === "/") {
                    e.preventDefault();
                    setTimeout(() => {
                      scrollToTarget(item.id, -80);
                    }, 100);
                  }
                }}
              >
                <span>{item.name}</span>
                <span className="text-[#c5a059]">&rarr;</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Tour CTA */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#c5a059] via-[#dfba74] to-[#c5a059] text-black font-semibold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-[#c5a059]/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Book a Private Tour
            </button>
          </div>
        </div>
      )}

      {/* VIP Viewing Modal */}
      <VipViewingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Shortlisted Favorites Drawer */}
      <FavoritesDrawer isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} />
    </header>
  );
}
