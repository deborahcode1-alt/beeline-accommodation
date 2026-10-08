// The facts shown on a listing card and in the "About your place" dropdowns.

export type ParkingType = "NONE" | "STREET" | "OFF_STREET" | "COVERED";

export const PARKING_OPTIONS: { value: ParkingType; label: string; short: string | null }[] = [
  { value: "NONE", label: "No parking", short: null },
  { value: "STREET", label: "Street parking", short: "Street parking" },
  { value: "OFF_STREET", label: "Off-street parking", short: "Parking" },
  { value: "COVERED", label: "Garage or carport", short: "Covered parking" },
];

export function parkingShort(value: string | null | undefined) {
  return PARKING_OPTIONS.find((p) => p.value === value)?.short ?? null;
}

export const BEDROOM_CHOICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const BATHROOM_CHOICES = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6];

export function bedroomLabel(n: number) {
  if (n === 0) return "Studio";
  return `${n} bedroom${n === 1 ? "" : "s"}`;
}

export function bathroomLabel(n: number) {
  if (n === 0) return "Shared bathroom";
  return `${n} bathroom${n === 1 ? "" : "s"}`;
}

export const BLURB_LISTING_MAX = 160;
