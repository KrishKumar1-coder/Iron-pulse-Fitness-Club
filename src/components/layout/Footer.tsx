"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-[#050505] border-t border-white/10 text-white/70 py-12 sm:py-16 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
        {/* Brand */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-heading text-xl sm:text-2xl tracking-widest text-white uppercase">AURELIA</h3>
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
            Curating the world&apos;s most exceptional architectural masterpieces and prime luxury residences.
          </p>
          <div className="flex gap-3 pt-1">
            <Link href="/#location" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-[#c5a059] transition-colors" title="Flagship Office">
              <Globe className="w-4 h-4" />
            </Link>
            <a href="mailto:concierge@aureliaestates.com" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-[#c5a059] transition-colors" title="Email">
              <Mail className="w-4 h-4" />
            </a>
            <a href="tel:+13108994000" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-[#c5a059] transition-colors" title="Call">
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4">Portfolios</h4>
          <ul className="space-y-2 text-xs sm:text-sm text-white/50">
            <li><Link href="/#featured-properties" className="hover:text-white transition-colors">Beverly Hills Estates</Link></li>
            <li><Link href="/#featured-properties" className="hover:text-white transition-colors">Miami Beach Waterfront</Link></li>
            <li><Link href="/#featured-properties" className="hover:text-white transition-colors">Aspen Mountain Lodges</Link></li>
            <li><Link href="/#featured-properties" className="hover:text-white transition-colors">Manhattan Penthouses</Link></li>
          </ul>
        </div>

        {/* Advisory */}
        <div>
          <h4 className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4">Advisory</h4>
          <ul className="space-y-2 text-xs sm:text-sm text-white/50">
            <li><Link href="/#location" className="hover:text-white transition-colors">Private Office & Flagship</Link></li>
            <li><Link href="/#about" className="hover:text-white transition-colors">Market Intelligence</Link></li>
            <li><Link href="/#about" className="hover:text-white transition-colors">Acquisitions & Sales</Link></li>
            <li><Link href="/#location" className="hover:text-white transition-colors">Private Client Services</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-2.5 sm:space-y-3">
          <h4 className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4">Direct Contact</h4>
          <Link href="/#location" className="text-xs sm:text-sm flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <MapPin className="w-4 h-4 text-[#c5a059] shrink-0" /> 
            <span>9460 Wilshire Blvd, Beverly Hills, CA</span>
          </Link>
          <p className="text-xs sm:text-sm flex items-center gap-2 text-white/60">
            <Phone className="w-4 h-4 text-[#c5a059] shrink-0" /> 
            <span>+1 (310) 899-4000</span>
          </p>
          <p className="text-xs sm:text-sm flex items-center gap-2 text-white/60">
            <Mail className="w-4 h-4 text-[#c5a059] shrink-0" /> 
            <span>contact@aureliaestates.com</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[11px] sm:text-xs text-white/40 gap-4 text-center sm:text-left">
        <p>&copy; {new Date().getFullYear()} Aurelia Estates International. All rights reserved.</p>
        <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-center">
          <span className="text-white/50 cursor-default">Confidential Client Representation</span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-white/50 cursor-default">Equal Housing Opportunity</span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <Link href="/#location" className="hover:text-[#c5a059] transition-colors">Beverly Hills Private Office</Link>
        </div>
      </div>
    </footer>
  );
}
