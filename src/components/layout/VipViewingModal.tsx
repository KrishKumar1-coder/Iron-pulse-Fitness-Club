"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, User, Mail, Phone, MessageSquare, Building2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VipViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyTitle?: string;
}

export function VipViewingModal({ isOpen, onClose, defaultPropertyTitle }: VipViewingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactReason, setContactReason] = useState(
    defaultPropertyTitle ? `Enquiry for ${defaultPropertyTitle}` : "Book a Private Tour"
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (defaultPropertyTitle) {
      setContactReason(`Enquiry for ${defaultPropertyTitle}`);
    } else {
      setContactReason("Book a Private Tour");
    }
  }, [defaultPropertyTitle]);

  // Lock background scroll via modal-open class without resetting window.scrollY
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

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanName = fullName.trim() || "VIP Client";
    const cleanPhone = phone.trim() || undefined;
    const cleanEmail = email.trim() || (cleanPhone ? `${cleanPhone.replace(/\D/g, "")}@phoneinquiry.com` : "vip@client.com");

    if (!fullName.trim() && !phone.trim() && !email.trim()) return;

    setIsSubmitting(true);
    const randomRef = `AUR-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingRef(randomRef);

    const targetProperty = defaultPropertyTitle || "General Portfolio";
    const finalReason = defaultPropertyTitle ? `Enquiry for ${defaultPropertyTitle}` : contactReason;

    try {
      // 1. Save to Supabase tourBookings
      const okTour = await supabase.tourBookings.create({
        client_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        preferred_date: "Earliest Available",
        preferred_time: "Business Hours",
        property_title: targetProperty,
        special_requests: `${finalReason} • Note: ${message.trim() || "No additional note"} • Ref #${randomRef}`,
        status: "Pending",
      });

      // 2. Save to Supabase leads
      const okLead = await supabase.leads.create({
        client_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        property_title: targetProperty,
        interest_type: finalReason,
        status: "New",
        notes: message.trim() ? `${finalReason} — ${message.trim()}` : finalReason,
      });

      if (okTour || okLead) {
        setIsSubmitted(true);
      } else {
        setFormError("Submission could not be completed. If you recently sent multiple inquiries, please wait 60 seconds before trying again.");
      }
    } catch (err) {
      console.error("Error submitting contact form:", err);
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
      <div 
        data-lenis-prevent="true"
        className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92dvh] text-white"
        style={{ overscrollBehavior: "contain" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dedicated Header Row with Close Button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#c5a059] font-semibold">
              Private Advisory Desk
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer touch-manipulation active:scale-90 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center mx-auto text-[#c5a059]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#c5a059] font-medium">Inquiry Submitted</span>
              <h3 className="text-2xl font-heading text-white">Thank You, {fullName}!</h3>
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                Your inquiry has been received. Our senior advisor will reach out to you directly via phone or email shortly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 max-w-xs mx-auto text-left text-xs space-y-1.5">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white/40">Reference ID:</span>
                <span className="font-mono text-[#c5a059] font-semibold">{bookingRef}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white/40">Inquiry:</span>
                <span className="text-white font-medium truncate max-w-[170px]">
                  {defaultPropertyTitle ? `Enquiry for ${defaultPropertyTitle}` : contactReason}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Contact:</span>
                <span className="text-white truncate max-w-[170px]">{phone}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="py-3 px-8 bg-[#c5a059] hover:bg-[#dfba74] text-black font-semibold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#c5a059] font-semibold">Contact Aurelia Estates</span>
              <h2 className="text-xl sm:text-2xl font-heading text-white mt-0.5">
                {defaultPropertyTitle ? "Schedule Private Viewing" : "Private Inquiry"}
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Fill in your contact details below to connect with our private advisory desk.
              </p>
            </div>

            {/* When already on a specific property, display it cleanly as auto-filled context (NO choice needed!) */}
            {defaultPropertyTitle && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center gap-2.5 text-xs text-[#c5a059]">
                <Building2 className="w-4 h-4 shrink-0" />
                <div className="truncate">
                  <span className="text-white/50 font-normal">Enquiry for: </span>
                  <span className="font-semibold text-white">{defaultPropertyTitle}</span>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs leading-relaxed animate-fade-in">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-white/60 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c5a059] transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-white/60 font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (310) 899-4000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c5a059] transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-white/60 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c5a059] transition-colors"
                  />
                </div>
              </div>

              {/* For what they want to contact: ONLY shown when NOT already on a specific property! */}
              {!defaultPropertyTitle && (
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-white/60 font-medium">Reason for Contact</label>
                  <select
                    value={contactReason}
                    onChange={(e) => setContactReason(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#c5a059] transition-colors cursor-pointer"
                  >
                    <option value="Book a Private Tour">Book a Private Tour</option>
                    <option value="General Portfolio Inquiry">General Portfolio Inquiry</option>
                    <option value="Property Acquisition Advisory">Property Acquisition Advisory</option>
                    <option value="Speak with Private Advisor">Speak with Private Advisor</option>
                  </select>
                </div>
              )}

              {/* Optional Note / Message */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
                  Message / Note <span className="text-white/30 text-[10px] lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
                  <textarea
                    rows={2}
                    placeholder="Any specific requests or questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#c5a059] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Simple Clean Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 min-h-[48px] bg-[#c5a059] hover:opacity-90 text-black font-semibold uppercase tracking-wider text-xs rounded-xl transition-opacity cursor-pointer disabled:opacity-50 mt-3 flex items-center justify-center touch-manipulation active:scale-[0.98]"
              >
                <span>{isSubmitting ? "Sending Inquiry..." : "Submit Inquiry"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
