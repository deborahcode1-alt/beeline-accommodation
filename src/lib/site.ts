export const SITE_NAME = "Beeline Accommodation";
export const SITE_TAGLINE = "A Direct Route to Your Next Stay";
export const SITE_SLOGAN = "Stay Local. Book Direct.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gympie-accommodation.vercel.app";
// Shown at checkout for a listing that has no cancellationPolicy of its own set.
// Draft only — replace with the host's real policy before taking real payments.
export const DEFAULT_CANCELLATION_POLICY = `This is a draft cancellation policy. Please replace it with your real terms before accepting real payments.

Free cancellation up to 7 days before check-in. Cancellations within 7 days of check-in are non-refundable. No-shows are charged in full. Check-in is from 2pm and check-out is by 11am unless otherwise agreed with the host. Guests are responsible for any damage caused during their stay.`;
