import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beverly Hills Flagship Headquarters & Private Office | Aurelia Estates",
  description:
    "Visit our flagship private office at 9460 Wilshire Blvd, Penthouse Suite, Beverly Hills, CA 90212 for confidential acquisition advisory and portfolio representation.",
  alternates: {
    canonical: "/location",
  },
  openGraph: {
    title: "Beverly Hills Flagship Headquarters & Private Office | Aurelia Estates",
    description:
      "Visit our flagship private office at 9460 Wilshire Blvd, Penthouse Suite, Beverly Hills, CA 90212 for confidential acquisition advisory and portfolio representation.",
    url: "https://www.aureliaestates.com/location",
    images: ["/preview_final_master.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beverly Hills Flagship Headquarters | Aurelia Estates",
    description:
      "Visit our flagship private office at 9460 Wilshire Blvd, Penthouse Suite, Beverly Hills, CA 90212.",
    images: ["/preview_final_master.png"],
  },
};

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

