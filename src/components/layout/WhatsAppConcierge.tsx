"use client";

import { usePathname } from "next/navigation";
import { MessageSquare, ArrowUpRight } from "lucide-react";

export function WhatsAppConcierge() {
  const pathname = usePathname();
  const defaultPhone = "13108994000";

  // Hide WhatsApp concierge widget inside the admin portal so it doesn't cover tables
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleDirectWhatsApp = () => {
    const generalInquiryMessage = "Hello Aurelia Estates, I would like to inquire about your exclusive luxury properties and private advisory services.";
    const encodedMessage = encodeURIComponent(generalInquiryMessage);
    window.open(`https://wa.me/${defaultPhone}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
      <button
        onClick={handleDirectWhatsApp}
        className="group flex items-center gap-3 p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all duration-300 cursor-pointer backdrop-blur-xl border bg-[#0c0c0c]/90 text-white border-white/20 hover:border-[#25D366]/60 hover:shadow-[#25D366]/20 active:scale-95 sm:hover:scale-105"
        title="Chat directly on WhatsApp"
        aria-label="Direct WhatsApp Inquiry"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
            <MessageSquare className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
        </div>

        <div className="hidden sm:flex flex-col items-start pr-1 text-left">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#c5a059] group-hover:text-[#25D366] transition-colors">
            Have Questions?
          </span>
          <span className="text-xs font-medium text-white/90 transition-colors flex items-center gap-1">
            <span>Chat on WhatsApp</span>
            <ArrowUpRight className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
          </span>
        </div>
      </button>
    </div>
  );
}
