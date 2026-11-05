"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { scrollToTarget } from "@/utils/scrollTo";

export function AboutPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Image reveal animation - Smooth Left-to-Right luxury slide (matches map entrance, calm & visible)
      gsap.fromTo(
        ".about-image-wrapper",
        { opacity: 0, x: -100 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 1.5, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-image-container",
            start: "top 85%",
            invalidateOnRefresh: true,
          }
        }
      );

      // Text reveal animation
      gsap.fromTo(
        ".about-text",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-content",
            start: "top 90%",
            invalidateOnRefresh: true,
          }
        }
      );

      // Numbers animation
      gsap.fromTo(
        ".about-stat",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-stats",
            start: "top 92%",
            invalidateOnRefresh: true,
          }
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={containerRef} className="py-16 sm:py-24 md:py-32 bg-[#0f0e0d] relative overflow-hidden scroll-mt-24 transition-colors duration-1000">
      {/* Distinct Ambient Warm Glow */}
      <div 
        className="absolute top-1/4 -left-32 w-[350px] sm:w-[750px] h-[350px] sm:h-[750px] blur-[120px] sm:blur-[180px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: "var(--theme-glow-3)" }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Owner Portrait Side - Formatted with true 2:3 aspect ratio so the entire owner photo is complete & never cropped */}
          <div className="about-image-container flex items-center justify-center w-full">
            <div className="about-image-wrapper relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] lg:max-w-[460px] aspect-[2/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#121316]">
              <Image
                src="https://images.pexels.com/photos/33761232/pexels-photo-33761232.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Jonathan Sterling - Founder and CEO of Aurelia Estates"
                fill
                loading="lazy"
                sizes="(max-width: 640px) 360px, (max-width: 1024px) 420px, 460px"
                className="about-image object-cover object-[center_top] transition-transform duration-700 hover:scale-[1.02]"
              />

              {/* Ambient Luxury Dark Edge Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

              {/* Experience Badge - Clean, compact luxury badge positioned neatly in corner without obscuring portrait */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-[#0a0a0c]/85 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-white/10 z-10 shadow-2xl">
                <div className="text-xl sm:text-3xl font-heading font-light leading-none mb-1" style={{ color: "var(--theme-accent)" }}>25+</div>
                <div className="text-[10px] sm:text-xs text-white/80 font-medium uppercase tracking-wider leading-tight">Years of Excellence</div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="about-content flex flex-col justify-center">
            <h4 className="about-text font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: "var(--theme-accent)" }}>
              Our Heritage
            </h4>
            <h2 className="about-text text-3xl sm:text-4xl md:text-5xl font-heading font-light text-white mb-4 sm:mb-6 leading-tight">
              Redefining the <span className="font-medium italic" style={{ color: "var(--theme-accent)" }}>Standard</span> of Luxury Real Estate.
            </h2>
            <p className="about-text text-white/60 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 font-light">
              Founded on the principles of unparalleled service and extraordinary vision, Aurelia Real Estate has spent over two decades curating the most exquisite properties for the world&apos;s most discerning individuals. We don&apos;t just sell homes; we curate lifestyles.
            </p>

            <div className="about-text flex items-center gap-4 mb-8 sm:mb-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden relative border-2 shrink-0" style={{ borderColor: "var(--theme-accent)" }}>
                <Image 
                  src="https://images.pexels.com/photos/33761230/pexels-photo-33761230.jpeg?auto=compress&cs=tinysrgb&w=300"
                  alt="Jonathan Sterling - Founder and CEO of Aurelia Estates"
                  fill
                  className="object-cover object-[50%_18%]"
                />
              </div>
              <div>
                <div className="text-white font-medium text-base sm:text-lg">Jonathan Sterling</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--theme-accent)" }}>Founder & CEO</div>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => {
                scrollToTarget("featured-properties", -80);
              }}
              className="about-text group flex items-center gap-3 sm:gap-4 text-white hover:text-[#c5a059] transition-colors w-fit cursor-pointer touch-manipulation min-h-[44px]"
            >
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase">Discover Our Residences</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#c5a059] transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

        </div>

        {/* Stats Row */}
        <div className="about-stats mt-16 sm:mt-24 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 border-t border-white/10 pt-10 sm:pt-16">
          {[
            { label: "Properties Sold", value: "$4.2B" },
            { label: "Global Partners", value: "150+" },
            { label: "Active Listings", value: "85" },
            { label: "Industry Awards", value: "32" }
          ].map((stat, i) => (
            <div key={i} className="about-stat flex flex-col gap-1 sm:gap-2 p-3 sm:p-0">
              <div className="text-3xl sm:text-4xl md:text-5xl font-heading font-light text-white">{stat.value}</div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
