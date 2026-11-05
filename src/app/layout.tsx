import type { Metadata } from "next";
import { Outfit, Inter, Cormorant_Garamond } from "next/font/google";
import { SmoothScrolling } from "@/components/layout/SmoothScrolling";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { WhatsAppConcierge } from "@/components/layout/WhatsAppConcierge";
import { AdminShortcutListener } from "@/components/layout/AdminShortcutListener";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aureliaestates.com"),
  title: {
    default: "Aurelia Estates | Curated Luxury Real Estate & Private Residences",
    template: "%s | Aurelia Estates",
  },
  description:
    "Aurelia Estates curates the world's most exceptional private estates, modern architectural compounds, and luxury penthouses in Beverly Hills, Malibu, Aspen, Miami Beach, and Manhattan.",
  keywords: [
    "luxury real estate",
    "Beverly Hills estates",
    "Malibu oceanfront homes",
    "Aspen chalets",
    "Miami Beach mansions",
    "architectural penthouses",
    "private client real estate advisory",
    "Aurelia Estates International",
  ],
  authors: [{ name: "Aurelia Estates International" }],
  creator: "Aurelia Estates",
  publisher: "Aurelia Estates International",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Aurelia Estates | Curated Luxury Real Estate & Private Residences",
    description:
      "Explore ultra-exclusive private estates, oceanfront villas, and architectural penthouses worldwide with Aurelia Estates International.",
    url: "https://www.aureliaestates.com",
    siteName: "Aurelia Estates International",
    images: [
      {
        url: "/preview_final_master.png",
        width: 1200,
        height: 630,
        alt: "Aurelia Estates International Luxury Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurelia Estates | Curated Luxury Real Estate",
    description:
      "Explore ultra-exclusive private estates, oceanfront villas, and architectural penthouses worldwide.",
    images: ["/preview_final_master.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RealEstateAgent",
      "@id": "https://www.aureliaestates.com/#organization",
      "name": "Aurelia Estates International",
      "url": "https://www.aureliaestates.com",
      "logo": "https://www.aureliaestates.com/logo.png",
      "image": "https://www.aureliaestates.com/preview_final_master.png",
      "description":
        "Curating the world's most exceptional private estates, modern architectural compounds, and luxury residences for discerning clientele.",
      "telephone": "+1-310-899-4000",
      "email": "concierge@aureliaestates.com",
      "priceRange": "$$$$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "9460 Wilshire Blvd, Penthouse Suite",
        "addressLocality": "Beverly Hills",
        "addressRegion": "CA",
        "postalCode": "90212",
        "addressCountry": "US",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 34.0664,
        "longitude": -118.3995,
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "19:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "10:00",
          "closes": "17:00",
        },
      ],
      "areaServed": [
        "Beverly Hills, CA",
        "Malibu, CA",
        "Aspen, CO",
        "Miami Beach, FL",
        "New York, NY",
        "Hollywood Hills, CA",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.aureliaestates.com/#website",
      "url": "https://www.aureliaestates.com",
      "name": "Aurelia Estates",
      "description": "Curated Luxury Real Estate & Private Residences",
      "publisher": {
        "@id": "https://www.aureliaestates.com/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.aureliaestates.com/properties?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${cormorant.variable} bg-black text-white antialiased`}
    >
      <head>
        {/* Preconnect & DNS-prefetch to external asset domains for optimized TTFB and Core Web Vitals */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <link rel="preconnect" href="https://sldtibqmumlfupranpbr.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://sldtibqmumlfupranpbr.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <AdminShortcutListener />
        <CurrencyProvider>
          <FavoritesProvider>
            <SmoothScrolling>{children}</SmoothScrolling>
            <WhatsAppConcierge />
          </FavoritesProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
