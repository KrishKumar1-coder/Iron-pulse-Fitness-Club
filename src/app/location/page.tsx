"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { OfficeLocation } from "@/components/home/OfficeLocation";
import { VipViewingModal } from "@/components/layout/VipViewingModal";

export default function LocationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="container mx-auto px-6 pt-32 pb-4 max-w-7xl relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group text-xs uppercase tracking-widest font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="flex-1">
        <OfficeLocation onScheduleConsultation={() => setIsModalOpen(true)} />
      </div>

      <Footer />

      <VipViewingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}
