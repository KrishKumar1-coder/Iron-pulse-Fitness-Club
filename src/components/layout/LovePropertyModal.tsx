"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { 
  X, Check, Send, Heart,
  Mail, User, Phone, MessageSquare, Building2
} from "lucide-react";
import { Property } from "@/data/properties";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/lib/supabase";

interface LovePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSaved?: (propertyId: number) => void;
}

export function LovePropertyModal({
  isOpen,
  onClose,
  property,
  onSaved,
}: LovePropertyModalProps) {
  const [mounted, setMounted] = useState(false);
  const { formatPrice } = useCurrency();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll cleanly without resetting window.scrollY
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      setIsSubmitted(false);
      setFormError(null);
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen || !property || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanName = name.trim() || "VIP Client";
    const cleanPhone = phone.trim() || undefined;
    const cleanEmail = email.trim() || (cleanPhone ? `${cleanPhone.replace(/\D/g, "")}@phoneinquiry.com` : "vip@client.com");

    if (!name.trim() && !phone.trim() && !email.trim()) return;

    setIsSubmitting(true);
    // Save to favorites / loved
    onSaved?.(property.id);

    try {
      // Save lead to Supabase in real-time
      const okLead = await supabase.leads.create({
        client_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        property_id: property.id,
        property_title: property.title,
        property_location: property.location,
        property_price: property.price,
        interest_type: `Enquiry for ${property.title}`,
        status: "New",
        notes: message.trim() ? `Enquiry for ${property.title} — Note: ${message.trim()}` : `Enquiry for ${property.title}`,
      });

      // Also register in tour bookings for comprehensive admin visibility
      const okTour = await supabase.tourBookings.create({
        client_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        preferred_date: "Earliest Available",
        preferred_time: "Business Hours",
        property_title: property.title,
        special_requests: `Enquiry for ${property.title}${message.trim() ? ` • Note: ${message.trim()}` : ""}`,
        status: "Pending",
      });

      if (okLead || okTour) {
        setIsSubmitted(true);
      } else {
        setFormError("Submission could not be completed. If you recently sent multiple inquiries, please wait 60 seconds before trying again.");
      }
    } catch (err) {
      console.error("Error submitting lead:", err);
      setFormError("Network communication error. Please try again or reach our desk directly at +1 (310) 899-4000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Box */}
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-md bg-[#0e0e0e] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-white overflow-y-auto max-h-[92dvh] my-auto"
        style={{ overscrollBehavior: "contain" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dedicated Top Bar with Close Button — Zero overlap with any form content */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Heart className="w-3.5 h-3.5 fill-[#c5a059]" />
            </div>
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#c5a059] font-semibold">
              Save & Inquire
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer touch-manipulation active:scale-90 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          /* Thank You Confirmation Screen */
          <div className="py-6 text-center space-y-4 animate-fade-in relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center mx-auto text-[#c5a059] shadow-lg">
              <Check className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-heading font-light text-white">
                Inquiry Received
              </h3>
              <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed">
                Thank you, <span className="text-white font-medium">{name}</span>. Your inquiry for{" "}
                <span className="text-[#c5a059] font-medium">{property.title}</span> has been sent. Our advisor will contact you shortly.
              </p>
            </div>

            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-full bg-[#c5a059] hover:bg-[#dfba74] text-black font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          /* Main Form Screen */
          <div className="space-y-4 relative z-10">
            {/* Auto-filled Property Preview (NO random choice options needed!) */}
            <div className="flex gap-3.5 items-center p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#1a1a1a] border border-white/10">
                <Image
                  src={property.images[0]}
                  alt={property.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#c5a059] font-medium uppercase tracking-wider mb-0.5">
                  <Building2 className="w-3 h-3" />
                  <span>Enquiry for this Property</span>
                </div>
                <h4 className="font-heading text-sm font-medium text-white truncate">
                  {property.title}
                </h4>
                <p className="text-[11px] text-[#c5a059] font-mono mt-0.5 font-semibold">
                  {formatPrice(property.priceValue)} &bull; <span className="text-white/40 font-normal">{property.location}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-heading text-white">
                Contact Advisory Desk
              </h3>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Enter your details to receive private details, floorplans, or schedule a viewing.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs leading-relaxed animate-fade-in">
                {formError}
              </div>
            )}

            {/* Streamlined Form: Only Name, Phone, Email, and Optional Note */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 block font-medium uppercase tracking-wider text-[11px]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-white/20 focus:border-[#c5a059] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 block font-medium uppercase tracking-wider text-[11px]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (310) 899-4000"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-white/20 focus:border-[#c5a059] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 block font-medium uppercase tracking-wider text-[11px]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-white/20 focus:border-[#c5a059] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Optional Message / Requirements */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 block font-medium uppercase tracking-wider text-[11px]">
                  Message / Requirements <span className="text-white/30 text-[10px] lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-white/30 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question or request a private tour..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-base sm:text-sm text-white placeholder-white/20 focus:border-[#c5a059] focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Simple Clean Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 min-h-[48px] bg-[#c5a059] hover:opacity-90 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-opacity cursor-pointer disabled:opacity-50 mt-3 flex items-center justify-center touch-manipulation active:scale-[0.98]"
              >
                <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
