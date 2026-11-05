"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Quote, Star, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

// Official Google Multi-Color SVG Logo
function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Google Chrome Browser Logo
function ChromeLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#18181b" stroke="#ffffff" strokeOpacity="0.1" />
      <circle cx="12" cy="12" r="4.2" fill="#4285F4" stroke="#ffffff" strokeWidth="1.2" />
      <path d="M12 2A10 10 0 0 1 21.5 9H12Z" fill="#EA4335" />
      <path d="M21.5 9A10 10 0 0 1 17 21.2L12 12Z" fill="#FBBC05" />
      <path d="M17 21.2A10 10 0 0 1 2.5 15L7.5 6.5L12 12Z" fill="#34A853" />
    </svg>
  );
}

const reviews = [
  {
    id: 1,
    name: "Lord Julian Vance",
    initial: "J",
    role: "Private Equity Principal, London",
    firm: "Vance Holdings International",
    avatarGradient: "from-[#d4af37] via-[#c5a059] to-[#8c6b2d]",
    avatarTextColor: "text-amber-100",
    comment:
      "Aurelia handled the discrete acquisition of our Bel Air sanctuary with unmatched professionalism. Their understanding of prime architecture is peerless.",
    location: "Acquisition in Bel Air, Los Angeles",
    verifiedDate: "October 2026",
    verifiedPlatform: "Google Verified Review",
    rating: "5.0",
  },
  {
    id: 2,
    name: "Elena Rostova",
    initial: "E",
    role: "Architectural Collector",
    firm: "Geneva Heritage Trust",
    avatarGradient: "from-[#38bdf8] via-[#0284c7] to-[#075985]",
    avatarTextColor: "text-sky-100",
    comment:
      "From private jet transfers to discreet architectural viewings in Aspen, the level of bespoke advisory exceeded every standard in international luxury real estate.",
    location: "Acquisition in Red Mountain, Aspen",
    verifiedDate: "September 2026",
    verifiedPlatform: "Google Verified Review",
    rating: "5.0",
  },
  {
    id: 3,
    name: "Marcus Sterling",
    initial: "M",
    role: "Tech Founder & Venture Capitalist",
    firm: "Sterling Ventures Global",
    avatarGradient: "from-[#34d399] via-[#059669] to-[#065f46]",
    avatarTextColor: "text-emerald-100",
    comment:
      "The floorplan simulations and direct private office negotiations secured our waterfront compound seamlessly. The pinnacle of luxury representation.",
    location: "Acquisition in Star Island, Miami",
    verifiedDate: "August 2026",
    verifiedPlatform: "Google Verified Review",
    rating: "5.0",
  },
  {
    id: 4,
    name: "Alistair & Vivienne Moreau",
    initial: "A",
    role: "Family Office Director, Monaco",
    firm: "Moreau Heritage Asset Group",
    avatarGradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
    avatarTextColor: "text-amber-100",
    comment:
      "Acquiring an off-market legacy estate required consummate discretion. Aurelia’s private concierge coordinated cross-border escrow flawlessly in record time.",
    location: "Acquisition in Port Royal, Naples",
    verifiedDate: "July 2026",
    verifiedPlatform: "Google Verified Review",
    rating: "5.0",
  },
  {
    id: 5,
    name: "Dr. Kenji Takahashi",
    initial: "K",
    role: "Biotech Founder & Art Patron",
    firm: "Takahashi Life Sciences, Tokyo",
    avatarGradient: "from-[#a855f7] via-[#7c3aed] to-[#581c87]",
    avatarTextColor: "text-purple-100",
    comment:
      "Their curation of modern architectural masterpieces is unmatched. The Matterport spatial walkthrough and physical private viewing in Malibu were world-class.",
    location: "Acquisition in Carbon Beach, Malibu",
    verifiedDate: "June 2026",
    verifiedPlatform: "Google Verified Review",
    rating: "5.0",
  },
  {
    id: 6,
    name: "Lady Charlotte Davenport",
    initial: "C",
    role: "Heritage Estate Trustee, Zurich",
    firm: "Davenport International Trust",
    avatarGradient: "from-[#ec4899] via-[#db2777] to-[#9d174d]",
    avatarTextColor: "text-pink-100",
    comment:
      "Discretion, deep market intelligence, and architectural pedigree. Aurelia Estates delivered a transaction of exceptional caliber for our family estate.",
    location: "Acquisition in Holmby Hills, Los Angeles",
    verifiedDate: "May 2026",
    verifiedPlatform: "Google Verified Review",
    rating: "5.0",
  },
];

// Tripled list for seamless infinite loop sliding
const TRIPLED_REVIEWS = [...reviews, ...reviews, ...reviews];

export function Testimonials() {
  // Start in the middle set of 6 items (index 6 = first item of middle set)
  const [currentIndex, setCurrentIndex] = useState(reviews.length);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Measure container and check screen size using ResizeObserver
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      setIsMobile(window.innerWidth < 768);
    };

    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(containerRef.current);
    }

    window.addEventListener("resize", updateSize);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Slide to next item ("one go, one come")
  const slideNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // Seamlessly wrap around when passing the middle duplicate set
      if (next >= reviews.length * 2) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(next - reviews.length);
        }, 460);
      }
      return next;
    });
  }, []);

  // Slide to previous item
  const slidePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const prevIndex = prev - 1;
      if (prevIndex < reviews.length) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(prevIndex + reviews.length);
        }, 460);
      }
      return prevIndex;
    });
  }, []);

  // Continuous auto-advance every 2.0s without locking or pausing
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      slideNext();
    }, 2000);

    return () => clearInterval(interval);
  }, [slideNext]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("button, a, input, select, textarea, [role='button']")) {
      touchStartX.current = null;
      return;
    }
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 45) {
        // Swiped left -> advance 1 card
        slideNext();
      } else if (diff < -45) {
        // Swiped right -> reverse 1 card
        slidePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Jump to specific review via pill indicator
  const jumpToReview = (targetReviewIndex: number) => {
    setIsTransitioning(true);
    setCurrentIndex(reviews.length + targetReviewIndex);
  };

  // Active review indicator (0 to 5)
  const activeReviewNumber = (currentIndex % reviews.length);

  // Exact card width and gap calculation
  // Desktop: 3 cards visible side-by-side with 24px (gap-6) spacing
  // Mobile: 1 card visible (full width)
  const gap = isMobile ? 16 : 24;
  const cardWidth = containerWidth > 0 
    ? (isMobile ? containerWidth : (containerWidth - 2 * gap) / 3)
    : 320;
  const shiftAmount = currentIndex * (cardWidth + gap);

  return (
    <section 
      id="testimonials" 
      className="py-16 sm:py-24 md:py-32 bg-[#090a0d] border-t border-white/5 relative z-10 px-4 sm:px-6 scroll-mt-24 transition-colors duration-1000 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 mb-1">
            <GoogleLogo className="w-3.5 h-3.5" />
            <span className="text-[11px] tracking-[0.2em] text-[#c5a059] uppercase font-semibold">
              Verified Client Office
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-light text-white tracking-wide">
            Testimonials of <span className="font-medium italic text-[#c5a059]">Distinction</span>
          </h2>
          <p className="text-white/60 text-xs sm:text-sm max-w-lg mx-auto">
            Discreet representation for discerning connoisseurs of extraordinary architecture worldwide.
          </p>
        </div>

        {/* Carousel Container */}
        <div ref={containerRef} className="relative overflow-hidden w-full">
          {/* Sliding Track: Shifts by exactly 1 card ("one go, one come") */}
          <div 
            className="flex transition-transform ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              gap: `${gap}px`,
              transform: `translateX(-${shiftAmount}px)`,
              transitionDuration: isTransitioning ? "450ms" : "0ms",
            }}
          >
            {TRIPLED_REVIEWS.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                style={{
                  width: `${cardWidth}px`,
                  minWidth: `${cardWidth}px`,
                  maxWidth: `${cardWidth}px`,
                }}
                className="shrink-0 group bg-gradient-to-b from-white/[0.05] to-white/[0.015] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#c5a059]/40 hover:shadow-[0_16px_45px_rgba(0,0,0,0.6)] transition-all duration-300 relative overflow-hidden backdrop-blur-xl"
              >
                {/* Subtle ambient luxury hover glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#c5a059]/15 transition-colors" />

                <div>
                  {/* Top Bar: 5 Stars & Google Verified Badge */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-[#c5a059] text-[#c5a059]" />
                      ))}
                      <span className="text-xs font-mono font-bold text-white/90 ml-1.5">{r.rating}</span>
                    </div>

                    <div 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/80 font-medium tracking-wide shadow-sm"
                      title={r.verifiedPlatform}
                    >
                      <GoogleLogo className="w-3 h-3 shrink-0" />
                      <span>Google Verified</span>
                    </div>
                  </div>

                  {/* Quote Icon & Text */}
                  <Quote className="w-6 h-6 text-[#c5a059]/40 mb-3" />
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed mb-6 font-light line-clamp-4 sm:line-clamp-5">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>

                {/* Client Profile Section */}
                <div className="pt-5 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with Google badge */}
                    <div className="relative shrink-0">
                      <div 
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${r.avatarGradient} p-[2px] shadow-lg flex items-center justify-center`}
                      >
                        <div className="w-full h-full rounded-full bg-[#0d0d0d] flex items-center justify-center font-heading font-semibold text-base text-white">
                          <span className={r.avatarTextColor}>{r.initial}</span>
                        </div>
                      </div>
                      <div 
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#111111] border border-white/20 flex items-center justify-center shadow-md"
                        title="Google Verified Reviewer"
                      >
                        <GoogleLogo className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-semibold text-xs sm:text-sm truncate font-heading">{r.name}</p>
                        <span title="Verified Client" className="inline-flex">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </span>
                      </div>
                      <p className="text-[11px] text-[#c5a059] truncate font-medium">{r.role}</p>
                      <p className="text-[10px] text-white/40 truncate">{r.location}</p>
                    </div>
                  </div>

                  {/* Chrome Verified Logo & Date */}
                  <div className="shrink-0 hidden xs:flex flex-col items-end text-right">
                    <div className="p-1 rounded-full bg-white/5 border border-white/10" title="Verified through Chrome Secure Office">
                      <ChromeLogo className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] text-white/30 font-mono mt-1">{r.verifiedDate}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Carousel Navigation Controls & Live Indicators */}
        <div className="mt-8 sm:mt-10 flex items-center justify-between max-w-4xl mx-auto px-2">
          {/* Previous Button (shifts 1 review right) */}
          <button
            type="button"
            onClick={slidePrev}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 bg-white/5 hover:bg-[#c5a059]/20 hover:border-[#c5a059] flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-90 touch-manipulation"
            aria-label="Previous Review"
          >
            <ChevronLeft className="w-5 h-5 text-[#c5a059]" />
          </button>

          {/* Center Indicator Bar & Counter */}
          <div className="flex flex-col items-center gap-2 select-none">
            {/* 6 Pill Indicators */}
            <div className="flex items-center gap-2">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => jumpToReview(idx)}
                  className="p-1 -m-1 cursor-pointer touch-manipulation group"
                  aria-label={`Jump to review ${idx + 1}`}
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeReviewNumber 
                        ? "w-8 sm:w-10 bg-[#c5a059]" 
                        : "w-2.5 sm:w-3 bg-white/20 group-hover:bg-white/40"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Position text (e.g. 01 / 06) */}
            <span className="text-[11px] font-mono text-[#c5a059] tracking-wider font-semibold">
              0{activeReviewNumber + 1} / 0{reviews.length}
            </span>
          </div>

          {/* Next Button (shifts 1 review left: "one go, one come") */}
          <button
            type="button"
            onClick={slideNext}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 bg-white/5 hover:bg-[#c5a059]/20 hover:border-[#c5a059] flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-90 touch-manipulation"
            aria-label="Next Review"
          >
            <ChevronRight className="w-5 h-5 text-[#c5a059]" />
          </button>
        </div>

      </div>
    </section>
  );
}
