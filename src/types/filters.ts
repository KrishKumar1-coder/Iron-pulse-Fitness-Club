export interface PropertyFilters {
  status: "For Sale" | "For Rent";
  location: string;
  type: string;
  price: string;
  beds: string;
  baths: string;
}

export const defaultFilters: PropertyFilters = {
  status: "For Sale",
  location: "All Locations",
  type: "All Types",
  price: "All Prices",
  beds: "Any",
  baths: "Any",
};

export const DROPDOWN_OPTIONS = {
  location: [
    "All Locations",
    "Beverly Hills, CA",
    "Malibu, CA",
    "Miami Beach, FL",
    "Aspen, CO",
    "New York, NY",
    "Hollywood Hills, CA"
  ],
  type: ["All Types", "Villa", "Penthouse", "Mansion", "Estate"],
  price: ["All Prices", "Under $10M", "$10M - $25M", "$25M - $50M", "$50M+"],
  beds: ["Any", "3+", "4+", "5+", "6+"],
  baths: ["Any", "3+", "4+", "5+", "6+"],
};
