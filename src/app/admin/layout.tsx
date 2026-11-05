import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restricted Principal Office | Aurelia Estates",
  description: "Confidential executive administrative portal for Aurelia Estates authorized principals.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

