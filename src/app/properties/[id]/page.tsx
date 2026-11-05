import type { Metadata, ResolvingMetadata } from "next";
import { properties } from "@/data/properties";
import { PropertyDetailClient } from "@/components/property/PropertyDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const propertyId = parseInt(id);
  const property = properties.find((p) => p.id === propertyId);

  if (!property) {
    return {
      title: "Property Not Found | Aurelia Estates",
      description: "The requested luxury property listing could not be found.",
    };
  }

  const title = `${property.title} | ${property.location} | Aurelia Estates`;
  const description = `${property.description.slice(0, 155)}... Featuring ${property.beds} bedrooms, ${property.baths} bathrooms, and ${property.sqft} sq ft in ${property.location}.`;
  const ogImage = property.images && property.images.length > 0 ? property.images[0] : "/1.png";
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `https://aureliaestates.com${ogImage}`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://aureliaestates.com/properties/${property.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://aureliaestates.com/properties/${property.id}`,
      siteName: "Aurelia Estates Luxury Portfolio",
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 675,
          alt: property.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullOgImage],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = parseInt(id);
  const property = properties.find((p) => p.id === propertyId);

  // Schema.org RealEstateListing + BreadcrumbList JSON-LD
  const jsonLd = property
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://aureliaestates.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Luxury Properties",
                "item": "https://aureliaestates.com/properties"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": property.title,
                "item": `https://aureliaestates.com/properties/${property.id}`
              }
            ]
          },
          {
            "@type": "RealEstateListing",
            "name": property.title,
            "description": property.description,
            "url": `https://aureliaestates.com/properties/${property.id}`,
            "image": property.images && property.images.length > 0
              ? (property.images[0].startsWith("http") ? property.images[0] : `https://aureliaestates.com${property.images[0]}`)
              : "https://aureliaestates.com/1.png",
            "offers": {
              "@type": "Offer",
              "price": property.priceValue || 0,
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "validFrom": "2026-01-01"
            },
            "about": {
              "@type": "SingleFamilyResidence",
              "name": property.title,
              "numberOfRooms": property.beds,
              "numberOfBedrooms": property.beds,
              "numberOfBathroomsTotal": property.baths,
              "floorSize": {
                "@type": "QuantitativeValue",
                "value": property.sqft.replace(/[^0-9]/g, ""),
                "unitCode": "FTK"
              },
              "address": {
                "@type": "PostalAddress",
                "addressLocality": property.location,
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            }
          }
        ]
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetailClient propertyId={propertyId} initialProperty={property} />
    </>
  );
}
