export interface LifestyleDestination {
  category: "aviation" | "dining" | "yachting" | "golf" | "shopping" | "wellness";
  name: string;
  time: string;
  distance: string;
  highlight: string;
  image: string;
}

export interface NeighborhoodData {
  district: string;
  summary: string;
  destinations: LifestyleDestination[];
}

export interface Property {
  id: number;
  title: string;
  location: string;
  locationKey: string;   // matches DROPDOWN_OPTIONS.location values
  type: string;          // matches DROPDOWN_OPTIONS.type values
  price: string;
  priceValue: number;    // raw number for range filtering
  beds: number;
  baths: number;
  sqft: string;
  images: string[];      // List of unique images
  badge: string;
  status: "For Sale" | "For Rent" | "Available" | "Under Contract" | "Sold" | string;
  description: string;
  dimensions: {
    room: string;
    size: string;
    sqft?: number;
    level?: string;
  }[];
  floorPlanUrl: string;   // Highly detailed textured colorful layout map
  virtualTourUrl?: string; // Interactive 3D Matterport / Virtual Tour URL
  neighborhood?: NeighborhoodData;
}


export const properties: Property[] = [
{
id: 1,
title: "The Glass Pavilion",
location: "Beverly Hills, CA",
locationKey: "Beverly Hills, CA",
type: "Villa",
price: "$18,500,000",
priceValue: 18500000,
beds: 6,
baths: 8,
sqft: "12,500",
images: [
  "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600596542815-ffad4c1539a9.jpg",
  "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600607687939-ce8a6c25118c.jpg",
  "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600566753376-12c8ab7fb75b.jpg",
  "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600585154526-990dced4db0d.jpg",
  "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600566752355-35792bedcfea.jpg"
],
badge: "New Listing",
status: "For Sale",
description: "Designed by world-renowned architects, The Glass Pavilion is a masterclass in modern minimalist architecture. Flooded with natural light, the estate seamlessly blends indoor and outdoor living with floor-to-ceiling glass walls, a private vineyard, an infinity-edge pool, and smart home automation throughout.",
dimensions: [
      { room: "Master Bedroom", size: "24' x 18'", sqft: 432, level: "Upper Level" },
      { room: "Living Room", size: "32' x 22'", sqft: 704, level: "Ground Level" },
      { room: "Dining Room", size: "18' x 14'", sqft: 252, level: "Ground Level" },
      { room: "Kitchen", size: "20' x 16'", sqft: 320, level: "Ground Level" },
      { room: "Private Cinema", size: "22' x 15'", sqft: 330, level: "Lower Level" }
    ],
    floorPlanUrl: "/floorplans/1.png",
    virtualTourUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj&play=1&qs=1&brand=0",
    neighborhood: {
      district: "Beverly Hills • Trousdale Estates",
      summary: "Nestled in California's premier residential enclave, offering swift access to private jet FBOs, Rodeo Drive couture, and championship golf.",
      destinations: [
        { category: "aviation", name: "Van Nuys Private Jet Terminal (VNY)", time: "18 mins", distance: "11.2 miles", highlight: "Signature Flight Support VIP Jet FBO", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=75" },
        { category: "shopping", name: "Rodeo Drive Golden Triangle", time: "6 mins", distance: "2.1 miles", highlight: "Chanel, Hermes & Cartier Couture Flagships", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "Spago & Gucci Osteria", time: "7 mins", distance: "2.4 miles", highlight: "Two-Star Michelin Celebrity Gastronomy", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=75" },
        { category: "golf", name: "Los Angeles Country Club", time: "8 mins", distance: "3.0 miles", highlight: "Historic North Course Championship Links", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Beverly Hilton Heliport", time: "5 mins", distance: "1.8 miles", highlight: "VIP Helicopter Coastal & Airport Transfers", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=75" }
      ]
    }
  },
  {
    id: 2,
    title: "Oceanfront Estate",
    location: "Malibu, CA",
    locationKey: "Malibu, CA",
    type: "Estate",
    price: "$24,000,000",
    priceValue: 24000000,
    beds: 5,
    baths: 6,
    sqft: "8,200",
    images: [
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600585154340-be6161a56a0c.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1512917774080-9991f1c4c750.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600607687920-4e2a09cf159d.jpg"
    ],
    badge: "Exclusive",
    status: "For Sale",
    description: "Perched on a private bluff overlooking the Pacific Ocean, this legendary Malibu estate offers unparalleled ocean views, private beach access, a professional-grade tennis court, and an expansive oceanfront deck with a wellness spa.",
    dimensions: [
      { room: "Grand Suite", size: "22' x 20'", sqft: 440, level: "Upper Level" },
      { room: "Living Pavilion", size: "30' x 24'", sqft: 720, level: "Ground Level" },
      { room: "Chef's Kitchen", size: "18' x 16'", sqft: 288, level: "Ground Level" },
      { room: "Ocean Terrace", size: "40' x 25'", sqft: 1000, level: "Ground Level" }
    ],
    floorPlanUrl: "/floorplans/2.png",
    virtualTourUrl: "https://my.matterport.com/show/?m=roWLLMMmPL8&play=1&qs=1&brand=0",
    neighborhood: {
      district: "Malibu • Carbon Beach (Billionaire's Beach)",
      summary: "Direct Pacific shoreline frontage with seamless access to waterfront member clubs, private coastal aviation, and mega-yacht marinas.",
      destinations: [
        { category: "dining", name: "Nobu Malibu & Soho Little Beach House", time: "5 mins", distance: "1.6 miles", highlight: "Oceanfront Culinary & Private Members Club", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=75" },
        { category: "wellness", name: "Malibu Racquet & Tennis Club", time: "4 mins", distance: "1.2 miles", highlight: "Championship Clay Courts & Wellness Spa", image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Santa Monica Private Airport (SMO)", time: "18 mins", distance: "12.4 miles", highlight: "Executive Turboprop & Private Jet Access", image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=75" },
        { category: "yachting", name: "Marina del Rey Yacht Harbor", time: "22 mins", distance: "16.8 miles", highlight: "Deepwater Berthing for 120ft+ Mega-Yachts", image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Malibu Coastal Helipad", time: "7 mins", distance: "2.8 miles", highlight: "10-Minute Helicopter Direct Link to LAX", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=75" }
      ]
    }
  },

  {
    id: 3,
    title: "Modern Oasis",
    location: "Hollywood Hills, CA",
    locationKey: "Hollywood Hills, CA",
    type: "Modern Home",
    price: "$12,900,000",
    priceValue: 12900000,
    beds: 4,
    baths: 5,
    sqft: "6,800",
    images: [
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1613490493576-7fde63acd811.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600566753190-17f0baa2a6c3.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1512918728675-ed5a9ecdebfd.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600607687939-ce8a6c25118c.jpg"
    ],
    badge: "Featured",
    status: "For Sale",
    description: "A striking architectural statement in the hills. Features jet-liner views of the city skyline, a dramatic 2-story entry hall, custom Italian cabinetry, a floating glass staircase, and a zero-edge dynamic pool.",
    dimensions: [
      { room: "Primary Suite", size: "20' x 18'", sqft: 360, level: "Upper Level" },
      { room: "Great Room", size: "28' x 22'", sqft: 616, level: "Ground Level" },
      { room: "Sky Lounge", size: "18' x 16'", sqft: 288, level: "Roof Deck" }
    ],
    floorPlanUrl: "/floorplans/3.png",
    neighborhood: {
      district: "Hollywood Hills • Bird Streets & Sunset Plaza",
      summary: "Perched above the Sunset Strip skyline, offering immediate proximity to private social bungalows, skyline dining, and Burbank private jets.",
      destinations: [
        { category: "dining", name: "San Vicente Bungalows & Soho House", time: "8 mins", distance: "2.5 miles", highlight: "Ultra-Exclusive Private Members Sanctuary", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "Sunset Plaza Terraces & Catch LA", time: "5 mins", distance: "1.4 miles", highlight: "Iconic Sunset Strip Fine Dining", image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Burbank Bob Hope Private Jet FBO (BUR)", time: "16 mins", distance: "9.2 miles", highlight: "Million Air VIP Executive Jet Terminal", image: "https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=800&q=75" },
        { category: "wellness", name: "Runyon Canyon Private Trailhead", time: "3 mins", distance: "0.8 miles", highlight: "Panoramic City & Ocean Ridge Hiking", image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=75" },
        { category: "shopping", name: "Melrose Place & Rodeo Drive", time: "10 mins", distance: "3.6 miles", highlight: "Haute Couture & Heritage Flagships", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=75" }
      ]
    }
  },
  {
    id: 4,
    title: "Palazzo di Palma",
    location: "Miami Beach, FL",
    locationKey: "Miami Beach, FL",
    type: "Mansion",
    price: "$31,000,000",
    priceValue: 31000000,
    virtualTourUrl: "https://my.matterport.com/show/?m=mAhpovQDTyu&play=1&qs=1&brand=0",
    beds: 7,
    baths: 9,
    sqft: "14,200",
    images: [
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1582268611958-ebfd161ef9cf.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600585154340-be6161a56a0c.jpg"
    ],
    badge: "Trophy Asset",
    status: "For Sale",
    description: "Palatial Venetian-inspired Mediterranean villa featuring deep-water yacht docking, private security gatehouse, and exquisite hand-carved limestone terraces.",
    dimensions: [
      { room: "Royal Suite", size: "26' x 22'", sqft: 572, level: "Upper Level" },
      { room: "Ballroom", size: "40' x 30'", sqft: 1200, level: "Ground Level" },
      { room: "Wine Cellar", size: "16' x 12'", sqft: 192, level: "Lower Level" }
    ],
    floorPlanUrl: "/floorplans/4.png",
    neighborhood: {
      district: "Miami Beach • Star Island & Venetian Islands",
      summary: "Direct deepwater Biscayne Bay ocean access, world-renowned yacht harbors, and premier South Beach nightlife.",
      destinations: [
        { category: "yachting", name: "Sunset Harbour Yacht Club", time: "5 mins", distance: "1.5 miles", highlight: "Protected Deepwater Mega-Yacht Berthing", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Miami-Opa Locka Executive Jet FBO (OPF)", time: "22 mins", distance: "14.2 miles", highlight: "Global Private Aviation Gateway", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "Carbone Miami & Papi Steak", time: "7 mins", distance: "2.2 miles", highlight: "Celebrated South of Fifth Culinary Destinations", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=75" },
        { category: "wellness", name: "Soho Beach House & Faena Club", time: "6 mins", distance: "1.9 miles", highlight: "Oceanfront Private Members Beachside Retreats", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=75" },
        { category: "golf", name: "Indian Creek Country Club", time: "14 mins", distance: "6.8 miles", highlight: "Exclusive Island Championship Golf Course", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=75" }
      ]
    }
  },
  {
    id: 5,
    title: "The Alpine Sanctuary",
    location: "Aspen, CO",
    locationKey: "Aspen, CO",
    type: "Chalet",
    price: "$27,500,000",
    priceValue: 27500000,
    beds: 6,
    baths: 7,
    sqft: "10,500",
    images: [
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1564013799919-ab600027ffc6.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600596542815-ffad4c1539a9.jpg"
    ],
    badge: "Ski-In / Ski-Out",
    status: "For Sale",
    description: "Architectural masterpiece with direct access to Aspen mountain slopes. Hand-hewn timbers, soaring stone fireplaces, and heated infinity hot spring spa.",
    dimensions: [
      { room: "Presidential Chalet", size: "24' x 20'", sqft: 480, level: "Upper Level" },
      { room: "Great Hearth", size: "36' x 26'", sqft: 936, level: "Main Level" }
    ],
    floorPlanUrl: "/floorplans/5.png",
    neighborhood: {
      district: "Aspen • Red Mountain & Downtown Core",
      summary: "Unrivaled ski-in/ski-out alpine sanctuary, minutes from private FBO runways and historic mountain clubs.",
      destinations: [
        { category: "wellness", name: "Aspen Mountain Silver Queen Gondola", time: "3 mins", distance: "0.7 miles", highlight: "Direct Ski-In / Ski-Out Slopeside Access", image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Aspen/Pitkin County Airport (ASE)", time: "10 mins", distance: "4.1 miles", highlight: "Atlantic Aviation Private Jet FBO", image: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "Matsuhisa Aspen & The French Alpine", time: "4 mins", distance: "1.1 miles", highlight: "World-Class Alpine Fine Dining", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "The Caribou Club", time: "5 mins", distance: "1.3 miles", highlight: "Aspen's Legendary Private Members Club", image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=75" },
        { category: "wellness", name: "The St. Regis Remède Spa", time: "4 mins", distance: "1.0 miles", highlight: "Luxury Thermal Baths & Hydrotherapy", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=75" }
      ]
    }
  },
  {
    id: 6,
    title: "Crown Penthouse",
    location: "New York, NY",
    locationKey: "New York, NY",
    type: "Penthouse",
    price: "$45,000,000",
    priceValue: 45000000,
    beds: 5,
    baths: 6,
    sqft: "9,000",
    images: [
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600047509807-ba8f99d2cdde.jpg",
      "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/photo-1600607687939-ce8a6c25118c.jpg"
    ],
    badge: "Ultra Luxury",
    status: "For Sale",
    description: "Soaring 90 stories above Central Park, this triplex penthouse offers 360-degree unobstructed panoramas of Manhattan, a private elevator, and rooftop pool.",
    dimensions: [
      { room: "Owner Suite", size: "30' x 20'", sqft: 600, level: "Upper Level" },
      { room: "Observatory", size: "35' x 25'", sqft: 875, level: "Top Level" }
    ],
    floorPlanUrl: "/floorplans/6.png",
    neighborhood: {
      district: "Manhattan • Billionaires' Row & Central Park South",
      summary: "Surrounded by Central Park, 3-star Michelin dining, private heliports, and premier cultural institutions.",
      destinations: [
        { category: "aviation", name: "West 30th Street Heliport (Blade)", time: "8 mins", distance: "1.8 miles", highlight: "5-Minute Direct Helicopter Links to JFK & EWR", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "Le Bernardin & Per Se", time: "4 mins", distance: "0.6 miles", highlight: "Three-Star Michelin Global Gastronomy", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=75" },
        { category: "shopping", name: "Bergdorf Goodman & Fifth Avenue", time: "5 mins", distance: "0.5 miles", highlight: "World-Renowned Haute Couture Flagships", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=75" },
        { category: "dining", name: "Carnegie Hall & Lincoln Center", time: "3 mins", distance: "0.4 miles", highlight: "Historic Performing Arts & Symphony Hall", image: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=75" },
        { category: "aviation", name: "Teterboro Airport (TEB)", time: "26 mins", distance: "11.5 miles", highlight: "New York's Primary Executive Jet Terminal", image: "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=800&q=75" }
      ]
    }
  }
];