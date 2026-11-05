import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curated Luxury Residences & Estates | Aurelia Estates",
  description:
    "Explore our comprehensive portfolio of trophy private estates, oceanfront compounds, and architectural penthouses in Beverly Hills, Malibu, Aspen, Miami Beach, and Manhattan.",
  alternates: {
    canonical: "/properties",
  },
  openGraph: {
    title: "Curated Luxury Residences & Estates | Aurelia Estates",
    description:
      "Explore our comprehensive portfolio of trophy private estates, oceanfront compounds, and architectural penthouses in Beverly Hills, Malibu, Aspen, Miami Beach, and Manhattan.",
    url: "https://www.aureliaestates.com/properties",
    images: ["/preview_final_master.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Curated Luxury Residences & Estates | Aurelia Estates",
    description:
      "Explore our comprehensive portfolio of trophy private estates, oceanfront compounds, and architectural penthouses in Beverly Hills, Malibu, Aspen, Miami Beach, and Manhattan.",
    images: ["/preview_final_master.png"],
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

