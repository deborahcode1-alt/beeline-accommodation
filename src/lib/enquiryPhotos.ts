// Limits for the house photos people can attach when they register their interest.
export const ENQUIRY_MAX_PHOTOS = 8;
export const ENQUIRY_MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB each
export const ENQUIRY_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const ENQUIRY_PATH_PREFIX = "enquiries/";

/** Only accept photo links that point at our own Blob storage, in the enquiries folder. */
export function isEnquiryPhotoUrl(url: string) {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith(`/${ENQUIRY_PATH_PREFIX}`)
    );
  } catch {
    return false;
  }
}
