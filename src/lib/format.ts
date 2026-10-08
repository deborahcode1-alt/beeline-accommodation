export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
}

// Booking/blocked dates are stored as UTC-midnight calendar dates, not moments in time —
// format in UTC so the displayed day doesn't shift with the viewer's timezone.
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

// A fixed date-and-time format (Queensland time) so the server and the browser always agree.
export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Brisbane",
  }).format(new Date(date));
}
