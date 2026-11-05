"use client";

import { useState } from "react";
import { 
  MapPin, Phone, Mail, Clock, ExternalLink, 
  Calendar, ShieldCheck, Building2, Copy, Check 
} from "lucide-react";
import { motion } from "framer-motion";

interface OfficeLocationProps {
  onScheduleConsultation?: () => void;
}

export function OfficeLocation({ onScheduleConsultation }: OfficeLocationProps) {
  const [copied, setCopied] = useState(false);
  const addressText = "9460 Wilshire Blvd, Penthouse Suite, Beverly Hills, CA 90212";

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(addressText).catch(() => {});
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = addressText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand("copy"); } catch { }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    "9460 Wilshire Blvd, Beverly Hills, CA 90212"
  )}`;

  return (
    <section 
      id="location" 
      className="py-16 sm:py-20 md:py-28 bg-[#0b0a08] border-t border-white/5 relative z-10 px-4 sm:px-6 scroll-mt-24 overflow-hidden transition-colors duration-1000"
    >
      {/* Background ambient glow */}
      <div 
        className="absolute top-1/3 -right-20 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] blur-[120px] sm:blur-[190px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(197, 160, 89, 0.10)" }}
      />
      <div 
        className="absolute bottom-10 -left-20 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] blur-[120px] sm:blur-[170px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(217, 155, 78, 0.08)" }}
      />

      <div className="max-w-7xl mx-auto relative z-10 space-y-10 sm:space-y-16">
        {/* Section Header: Subtle Fade-In on Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6 sm:pb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#c5a059] font-medium mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Flagship Private Office</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-light text-white tracking-wide">
              Our Beverly Hills <span className="italic font-medium text-[#c5a059]">Headquarters</span>
            </h2>
            <p className="text-white/60 text-xs sm:text-sm max-w-2xl mt-2 sm:mt-3 leading-relaxed font-light">
              Situated in the prestigious Golden Triangle of Beverly Hills, our private office welcomes discerning clients for confidential acquisitions, discreet portfolio advisory, and architectural commissions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider transition-all text-center min-h-[44px] touch-manipulation"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
            </a>

            {onScheduleConsultation && (
              <button
                type="button"
                onClick={onScheduleConsultation}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#c5a059] hover:opacity-90 text-black text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-lg text-center min-h-[44px] touch-manipulation active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Private Consultation</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Office Details & Embedded Google Map Grid: Enters from Left & Right and then stays static */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch overflow-hidden">
          
          {/* Left Details Card: Enters smoothly from the LEFT with a calm, visible 1.5s luxury glide */}
          <motion.div
            initial={{ opacity: 0, x: -120 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: "transform, opacity" }}
            className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-8 flex flex-col justify-between space-y-6 sm:space-y-8 backdrop-blur-md shadow-xl"
          >
            <div className="space-y-5 sm:space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#c5a059] font-semibold">Address & Office</span>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm sm:text-base text-white font-medium">9460 Wilshire Boulevard</p>
                      <p className="text-xs sm:text-sm text-white/60">Penthouse Suite • Golden Triangle</p>
                      <p className="text-xs sm:text-sm text-white/60">Beverly Hills, CA 90212</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy full address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Direct Contacts */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] uppercase tracking-widest text-[#c5a059] font-semibold">Direct Desk Contacts</span>
                <div className="space-y-2 text-xs sm:text-sm">
                  <a 
                    href="tel:+13108994000"
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#c5a059] shrink-0" />
                    <span>+1 (310) 899-4000</span>
                  </a>
                  <a 
                    href="mailto:concierge@aureliaestates.com"
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors truncate"
                  >
                    <Mail className="w-4 h-4 text-[#c5a059] shrink-0" />
                    <span className="truncate">concierge@aureliaestates.com</span>
                  </a>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] uppercase tracking-widest text-[#c5a059] font-semibold">Advisory Hours</span>
                <div className="flex items-start gap-3 text-xs text-white/60">
                  <Clock className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-white/80 font-medium">Monday – Friday: 9:00 AM – 7:00 PM PST</p>
                    <p>Saturday: 10:00 AM – 5:00 PM PST (By Appointment)</p>
                    <p className="text-[#c5a059]">Private jet & evening consultations arranged 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidentiality Badge */}
            <div className="pt-4 sm:pt-6 border-t border-white/5 flex items-center gap-3 text-xs text-white/50">
              <ShieldCheck className="w-4 h-4 text-[#c5a059] shrink-0" />
              <span>All appointments are strictly confidential under mutual NDA representation.</span>
            </div>
          </motion.div>

          {/* Right Column: Google Maps Interactive View enters smoothly from the RIGHT with a calm, visible 1.5s luxury glide */}
          <motion.div
            initial={{ opacity: 0, x: 120 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{ willChange: "transform, opacity" }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="relative w-full h-[320px] sm:h-[400px] lg:h-full lg:min-h-[460px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              {/* Google Maps Embed iframe with Wilshire Blvd location */}
              <iframe
                title="Aurelia Estates International Beverly Hills Office Location"
                src="https://maps.google.com/maps?q=9460+Wilshire+Blvd,+Beverly+Hills,+CA+90212&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                className="w-full h-full border-0 filter contrast-[1.08] saturate-[1.1]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              {/* Floating Top Office Pin Badge */}
              <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/15 shadow-xl pointer-events-none max-w-[220px] sm:max-w-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#c5a059] animate-pulse shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] sm:text-xs font-semibold text-white tracking-wide truncate">AURELIA ESTATES INTL</p>
                    <p className="text-[9px] sm:text-[11px] text-[#c5a059] font-medium truncate">9460 Wilshire Blvd • Penthouse</p>
                  </div>
                </div>
              </div>

              {/* Floating Route Action on Bottom */}
              <div className="absolute bottom-3 right-3 z-10">
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-black/85 hover:bg-[#c5a059] text-[#c5a059] hover:text-black border border-[#c5a059]/40 hover:border-[#c5a059] text-[10px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-1.5 shadow-xl"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
