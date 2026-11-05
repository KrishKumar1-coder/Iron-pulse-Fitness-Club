"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertySearch } from "@/components/home/PropertySearch";
import { PropertyFilters } from "@/types/filters";
import { scrollToTarget } from "@/utils/scrollTo";

const heroImages = [
  {
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920&auto=format&fit=crop",
    title: "Experience Living",
    subtitle: "Without Limits.",
    desc: "Curating the world's most exceptional private estates and architectural masterpieces for the most discerning clientele."
  },
  {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop",
    title: "Architectural Wonders",
    subtitle: "Tailored For You.",
    desc: "From waterfront sanctuaries to hillside compounds, explore ultra-exclusive residences designed without compromise."
  },
  {
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1920&auto=format&fit=crop",
    title: "Timeless Elegance &",
    subtitle: "Modern Luxury.",
    desc: "Unrivaled craftsmanship meets breathtaking panoramic horizons in every hand-selected sanctuary."
  }
];

const heroThemes = [
  { 
    name: "Living - Champagne Gold",
    accent: "#c5a059", 
    rgb: "197, 160, 89",
    light: "#dfc79b", 
    glow1: "rgba(197, 160, 89, 0.16)", // Classic Champagne Gold
    glow2: "rgba(227, 194, 131, 0.10)", // Soft Amber Tint
    glow3: "rgba(180, 130, 70, 0.11)"   // Subtle Bronze Gold
  },
  { 
    name: "Wonders - Warm Honey Amber",
    accent: "#ca8f54", 
    rgb: "202, 143, 84",
    light: "#e2b382", 
    glow1: "rgba(202, 143, 84, 0.16)",  // Muted Warm Honey (same scale as Champagne)
    glow2: "rgba(217, 155, 78, 0.10)",  // Soft Honey Glow
    glow3: "rgba(190, 130, 70, 0.11)"   // Warm Sandstone
  },
  { 
    name: "Elegance - Dusty Rose Bronze",
    accent: "#bf745d", 
    rgb: "191, 116, 93",
    light: "#daa18f", 
    glow1: "rgba(191, 116, 93, 0.16)",  // Muted Rose Bronze (same scale as Champagne)
    glow2: "rgba(210, 135, 110, 0.10)", // Soft Tuscan Glow
    glow3: "rgba(175, 105, 85, 0.11)"   // Velvet Bronze
  },
];

type FilterKey = "location" | "type" | "price" | "beds" | "baths";

interface HeroProps {
  filters: PropertyFilters;
  activeFilter: FilterKey | null;
  isSearched: boolean;
  onFilterChange: (key: keyof PropertyFilters, value: string) => void;
  onToggleFilter: (key: FilterKey) => void;
  onSearch: () => void;
  onExploreProperties?: () => void;
  onScheduleConsultation?: () => void;
}

export function Hero({
  filters,
  activeFilter,
  onFilterChange,
  onToggleFilter,
  onSearch,
  onExploreProperties,
  onScheduleConsultation
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = swipe left, -1 = swipe right

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Dynamically update page-wide theme colors & section-distinct ambient glows on slide change
  useEffect(() => {
    const root = document.documentElement;
    const theme = heroThemes[currentSlide];
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-accent-rgb", theme.rgb);
    root.style.setProperty("--theme-light", theme.light);
    root.style.setProperty("--theme-glow-1", theme.glow1);
    root.style.setProperty("--theme-glow-2", theme.glow2);
    root.style.setProperty("--theme-glow-3", theme.glow3);
  }, [currentSlide]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Entrance animations
      const tl = gsap.timeline();

      tl.fromTo(
        ".hero-text-line",
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power4.out", delay: 0.1 }
      )
      .fromTo(
        ".hero-subtext",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" },
        "-=0.6"
      )
      .fromTo(
        ".hero-cta",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: "power3.out" },
        "-=0.6"
      );

      // Only apply parallax fade on screens >= 768px to keep mobile view clear and stable
      if (textRef.current && typeof window !== "undefined" && window.innerWidth >= 768) {
        gsap.to(textRef.current, {
          y: 70,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Auto slide interval (swipes left every 8 seconds for a relaxed, luxury feel)
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // If touch originated on an interactive element, do not capture for background swipe
    const target = e.target as Element | null;
    const el = target?.nodeType === 1 ? target : target?.parentElement;
    if (el && el.closest("button, a, input, select, textarea, [role='button'], [data-prevent-swipe]")) {
      touchStartX.current = null;
      return;
    }
    touchStartX.current = e.targetTouches?.[0]?.clientX ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchEndX.current = e.targetTouches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) {
        if (diff > 50) {
          // Swiped left
          nextSlide();
        } else {
          // Swiped right
          prevSlide();
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Variants for Framer Motion slow luxury swipe transition
  const slideVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 1,
      scale: 1.05
    }),
    animate: {
      x: "0%",
      opacity: 1,
      scale: 1,
      transition: {
        x: { duration: 1.2, ease: [0.25, 1, 0.5, 1] as const },
        scale: { duration: 8, ease: "linear" as const }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 1,
      transition: {
        x: { duration: 1.2, ease: [0.25, 1, 0.5, 1] as const }
      }
    })
  };

  return (
    <section 
      ref={containerRef} 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-[100dvh] w-full flex flex-col justify-between pt-20 sm:pt-24 md:pt-28 pb-3 sm:pb-5 bg-[#050505] overflow-hidden"
    >
      {/* Background Image Carousel with Swipe Left Animation */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Ambient Top-Left Warm Glow */}
        <div 
          className="absolute -top-10 -left-10 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] blur-[120px] sm:blur-[180px] rounded-full pointer-events-none z-10 transition-colors duration-1000"
          style={{ backgroundColor: "var(--theme-glow-1)" }}
        />
        
        {/* Cinematic subtle directional shading matching reference demo (radiant villa & pool lighting) */}
        {/* 1. Left-hand subtle gradient so text pops out effortlessly without dimming the villa */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent sm:from-black/70 sm:via-black/25 sm:to-transparent z-10 pointer-events-none" />
        
        {/* 2. Top subtle header shade for crisp white navbar contrast */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black/75 via-black/25 to-transparent z-10 pointer-events-none" />
        
        {/* 3. Bottom smooth blend into Signature Properties */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/50 to-transparent z-10 pointer-events-none" />
        
        {/* 4. Ultra-soft mobile vignette */}
        <div className="absolute inset-0 bg-black/20 sm:hidden z-10 pointer-events-none" />

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={heroImages[currentSlide].url}
              alt={heroImages[currentSlide].title}
              fill
              priority={currentSlide === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Header Content: Centered & commanding across mobile, tablet & desktop */}
      <div 
        ref={textRef} 
        className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center lg:items-start text-center lg:text-left py-4 sm:py-6 md:py-8 max-w-7xl my-auto"
      >
        {/* Grand Hero Headline: Optimized & Bold on Mobile/Tablet */}
        <h1 className="flex flex-col space-y-1 sm:space-y-2 md:space-y-2.5 text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] font-heading font-light text-white tracking-tight leading-[1.12] sm:leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] max-w-4xl">
          <span className="overflow-hidden py-0.5 sm:py-1">
            <span className="hero-text-line block">
              {heroImages[currentSlide].title.split(" ")[0]}{" "}
              <span className="font-medium italic inline-block pr-1.5 transition-colors duration-500" style={{ color: "var(--theme-accent)" }}>
                {heroImages[currentSlide].title.split(" ").slice(1).join(" ")}
              </span>
            </span>
          </span>
          <span className="overflow-hidden py-0.5 sm:py-1">
            <span className="hero-text-line block font-normal text-white/95">
              {heroImages[currentSlide].subtitle}
            </span>
          </span>
        </h1>

        {/* Editorial Description Quote: Large, prominent, crisp & beautifully legible across mobile & desktop */}
        <div className="hero-subtext mt-4 sm:mt-6 md:mt-7 max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto lg:mx-0 w-full">
          <p className="font-luxury-serif italic text-lg xs:text-xl sm:text-2xl md:text-3xl text-white font-normal tracking-[0.02em] leading-[1.65] sm:leading-[1.6] px-2 sm:px-4 lg:px-0 lg:pl-6 border-l-0 lg:border-l-2 border-[#c5a059] drop-shadow-[0_4px_24px_rgba(0,0,0,0.98)] transition-all duration-500 text-center lg:text-left">
            &ldquo;{heroImages[currentSlide].desc}&rdquo;
          </p>
        </div>

        {/* Action Button Group */}
        <div className="hero-cta mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 w-full sm:w-auto relative z-30 pointer-events-auto">
          <button 
            type="button"
            onClick={() => {
              if (onExploreProperties) {
                onExploreProperties();
              } else {
                scrollToTarget("featured-properties", -80);
              }
            }}
            className="group relative w-full sm:w-auto min-h-[48px] px-7 py-3.5 sm:px-8 sm:py-4 bg-white text-black font-semibold text-xs sm:text-sm tracking-wider uppercase overflow-hidden rounded-full cursor-pointer shadow-2xl hover:shadow-white/20 active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Estates
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </span>
            <div 
              className="absolute inset-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out pointer-events-none" 
              style={{ 
                backgroundColor: "var(--theme-accent)",
                transition: "background-color 1.2s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s ease-in-out"
              }} 
            />
          </button>

          {onScheduleConsultation && (
            <button
              type="button"
              onClick={onScheduleConsultation}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-black/60 hover:bg-black/85 border-2 border-[#c5a059] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 text-center cursor-pointer shadow-xl touch-manipulation flex items-center justify-center backdrop-blur-md"
            >
              Book a Tour
            </button>
          )}
        </div>
      </div>

      {/* Embedded Search Bar & Slider Controls */}
      <div className="relative z-20 container mx-auto px-2 sm:px-6 flex flex-col items-center gap-2 sm:gap-3 mt-auto max-w-7xl pb-2 sm:pb-3">
        <PropertySearch
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          onToggleFilter={onToggleFilter}
          onSearch={onSearch}
        />

        {/* Slide Indicators & Navigation Controls */}
        <div className="w-full flex items-center justify-between px-3 sm:px-4 pt-1 sm:pt-1.5">
          {/* Slide Indicators */}
          <div className="flex gap-1.5 sm:gap-2 items-center select-none py-1">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentSlide ? 1 : -1);
                  setCurrentSlide(idx);
                }}
                className="p-1.5 -m-1 cursor-pointer touch-manipulation group"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentSlide ? "w-8 sm:w-10" : "w-2.5 sm:w-3 bg-white/30 group-hover:bg-white/60"
                  }`}
                  style={{ backgroundColor: idx === currentSlide ? "var(--theme-accent)" : undefined }}
                />
              </button>
            ))}
          </div>

          {/* Prev / Next Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-full border border-white/20 bg-black/45 backdrop-blur-md flex items-center justify-center text-white hover:border-white/50 active:scale-90 transition-all cursor-pointer shadow-lg touch-manipulation"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-full border border-white/20 bg-black/45 backdrop-blur-md flex items-center justify-center text-white hover:border-white/50 active:scale-90 transition-all cursor-pointer shadow-lg touch-manipulation"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}