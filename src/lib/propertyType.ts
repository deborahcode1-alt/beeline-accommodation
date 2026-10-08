export type PropertyType = "BUDGET" | "LUXURY" | "APARTMENT" | "FARM_STAY" | "BOUTIQUE_HOTEL" | "HOUSE";

export const PROPERTY_TYPES: { value: PropertyType; label: string; short: string; blurb: string }[] = [
  { value: "BUDGET", short: "Budget", label: "Budget", blurb: "Simple, great-value stays" },
  { value: "LUXURY", short: "Luxury", label: "Luxury", blurb: "Premium, special-occasion stays" },
  { value: "BOUTIQUE_HOTEL", short: "Boutique", label: "Boutique hotel rooms", blurb: "Characterful heritage rooms" },
  { value: "APARTMENT", short: "Apartment", label: "Apartments", blurb: "Self-contained apartments" },
  { value: "FARM_STAY", short: "Farm stay", label: "Acreage & farm stays", blurb: "Space, animals and country quiet" },
  { value: "HOUSE", short: "House", label: "Houses & townhouses", blurb: "Whole places to yourselves" },
];

export function propertyTypeLabel(value: PropertyType) {
  return PROPERTY_TYPES.find((t) => t.value === value)?.label ?? "Stay";
}

export function propertyTypeShort(value: PropertyType) {
  return PROPERTY_TYPES.find((t) => t.value === value)?.short ?? "Stay";
}

export function isPropertyType(value: string | undefined): value is PropertyType {
  return PROPERTY_TYPES.some((t) => t.value === value);
}

// Typical capacity per bedroom count, shown on the size tiles. 6 means "6 or more".
export const BEDROOM_TIERS: { bedrooms: number; typicalSleeps: number }[] = [
  { bedrooms: 1, typicalSleeps: 2 },
  { bedrooms: 2, typicalSleeps: 4 },
  { bedrooms: 3, typicalSleeps: 6 },
  { bedrooms: 4, typicalSleeps: 8 },
  { bedrooms: 5, typicalSleeps: 12 },
  { bedrooms: 6, typicalSleeps: 15 },
];

export function tierFor(bedrooms: number) {
  return Math.min(Math.max(bedrooms, 1), 6);
}
