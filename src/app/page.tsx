"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { AboutPreview } from "@/components/home/AboutPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { OfficeLocation } from "@/components/home/OfficeLocation";
import { PropertyFilters, defaultFilters } from "@/types/filters";
import { scrollToTarget } from "@/utils/scrollTo";

// Lazy code-split VIP consultation modal
const VipViewingModal = dynamic(
  () => import("@/components/layout/VipViewingModal").then((m) => m.VipViewingModal),
  { ssr: false }
);

type FilterKey = "location" | "type" | "price" | "beds" | "baths";

export default function Home() {
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [isSearched, setIsSearched] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationSubject, setConsultationSubject] = useState("");

  // If page loads or navigates with hash (e.g. /#about, /#featured-properties), smoothly scroll to it
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      const timer = setTimeout(() => {
        scrollToTarget(hash, -80);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // Section-by-section dynamic luxury ambient color shifts on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sectionThemes: Record<string, { accent: string; glow1: string; glow2: string }> = {
      "featured-properties": {
        accent: "#c5a059",
        glow1: "rgba(197, 160, 89, 0.16)",
        glow2: "rgba(217, 155, 78, 0.10)",
      },
      "about": {
        accent: "#d99b4e",
        glow1: "rgba(217, 155, 78, 0.16)",
        glow2: "rgba(200, 133, 94, 0.11)",
      },
      "testimonials": {
        accent: "#c8855e",
        glow1: "rgba(200, 133, 94, 0.15)",
        glow2: "rgba(197, 160, 89, 0.10)",
      },
      "location": {
        accent: "#c5a059",
        glow1: "rgba(197, 160, 89, 0.18)",
        glow2: "rgba(217, 155, 78, 0.12)",
      },
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const theme = sectionThemes[id];
            if (theme) {
              const root = document.documentElement;
              root.style.setProperty("--theme-accent", theme.accent);
              root.style.setProperty("--theme-glow-1", theme.glow1);
              root.style.setProperty("--theme-glow-2", theme.glow2);
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    const sectionIds = ["featured-properties", "about", "testimonials", "location"];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleFilterChange = (key: keyof PropertyFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleFilter = (key: FilterKey) => {
    setActiveFilter((prev) => (prev === key ? null : key));
  };

  const handleSearch = () => {
    setActiveFilter(null);
    setIsSearched(true);
    scrollToTarget("featured-properties", -80);
  };

  const handleViewAll = () => {
    setFilters(defaultFilters);
    setActiveFilter(null);
    setIsSearched(false);
    scrollToTarget("featured-properties", -80);
  };

  const handleExploreProperties = () => {
    scrollToTarget("featured-properties", -80);
  };

  return (
    <main className="flex-1 flex flex-col">
      <Navbar />
      <Hero
        filters={filters}
        activeFilter={activeFilter}
        isSearched={isSearched}
        onFilterChange={handleFilterChange}
        onToggleFilter={handleToggleFilter}
        onSearch={handleSearch}
        onExploreProperties={handleExploreProperties}
        onScheduleConsultation={() => {
          setConsultationSubject("General Advisory & Private Portfolio Consultation");
          setIsConsultationModalOpen(true);
        }}
      />
      <div id="featured-properties" className="scroll-mt-20">
        <FeaturedProperties 
          filters={filters} 
          isSearched={isSearched} 
          onViewAll={handleViewAll}
          onOpenConsultation={(location) => {
            setConsultationSubject(`Private Sourcing & Off-Market Inquiry for ${location || "Exclusive Portfolio"}`);
            setIsConsultationModalOpen(true);
          }}
        />
      </div>
      <AboutPreview />
      <Testimonials />
      <OfficeLocation onScheduleConsultation={() => {
        setConsultationSubject("General Advisory & Portfolio Consultation");
        setIsConsultationModalOpen(true);
      }} />
      <Footer />
      <VipViewingModal
        isOpen={isConsultationModalOpen}
        onClose={() => {
          setIsConsultationModalOpen(false);
          setConsultationSubject("");
        }}
        defaultPropertyTitle={consultationSubject || undefined}
      />
    </main>
  );
}
