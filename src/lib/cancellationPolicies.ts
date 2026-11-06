// Ready-made cancellation policies a host can pick for a listing, modelled on the standard options
// guests already know from Airbnb and Booking.com, or the host can write their own.
// Pure data and text only, so the admin form, the save routes and the guest pages all share it.

export const POLICY_TYPES = ["flexible", "moderate", "firm", "strict", "nonrefundable", "custom"] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export type PolicyPreset = {
  type: Exclude<PolicyType, "custom">;
  name: string;
  /** One line for the host choosing between them. */
  summary: string;
  /** Who it suits, shown under the summary in the admin form. */
  suits: string;
  /** The wording guests read, one paragraph per entry. */
  paragraphs: string[];
};

// Days are counted back from check-in day, so "5 days before check-in" means five days before arrival.
const COUNTING = "Days are counted back from the check-in date.";
const HOST_CANCELS =
  "If the host has to cancel your stay, you receive a full refund. Refunds are made the way you paid. Nothing in this policy limits your rights under the Australian Consumer Law.";

export const POLICY_PRESETS: PolicyPreset[] = [
  {
    type: "flexible",
    name: "Flexible",
    summary: "Full refund up to 24 hours before check-in.",
    suits: "Most welcoming to guests. Like Airbnb's Flexible policy.",
    paragraphs: [
      "Flexible cancellation: free cancellation up to 24 hours before check-in.",
      "If you cancel less than 24 hours before check-in, or don't arrive, the first night is not refunded. The remaining nights are refunded in full.",
      HOST_CANCELS,
    ],
  },
  {
    type: "moderate",
    name: "Moderate",
    summary: "Full refund up to 5 days before check-in.",
    suits: "A good middle ground. Like Airbnb's Moderate policy.",
    paragraphs: [
      "Moderate cancellation: free cancellation up to 5 days before check-in.",
      `If you cancel less than 5 days before check-in, or don't arrive, the first night is not refunded and 50% of the remaining nights is refunded. ${COUNTING}`,
      HOST_CANCELS,
    ],
  },
  {
    type: "firm",
    name: "Firm",
    summary: "Full refund 30 days or more before check-in, half back from 30 to 7 days.",
    suits: "For hosts who turn away other bookings to hold the dates. Like Airbnb's Firm policy.",
    paragraphs: [
      "Firm cancellation: free cancellation if you cancel 30 days or more before check-in.",
      `If you cancel between 30 and 7 days before check-in, 50% of the total price is refunded. If you cancel less than 7 days before check-in, or don't arrive, there is no refund. ${COUNTING}`,
      "If you cancel within 48 hours of booking and check-in is at least 14 days away, you receive a full refund.",
      HOST_CANCELS,
    ],
  },
  {
    type: "strict",
    name: "Strict",
    summary: "Half back up to 7 days before check-in, nothing after.",
    suits: "The most protection for the host. Like Airbnb's Strict policy.",
    paragraphs: [
      "Strict cancellation: if you cancel 7 days or more before check-in, 50% of the total price is refunded.",
      `If you cancel less than 7 days before check-in, or don't arrive, there is no refund. ${COUNTING}`,
      "If you cancel within 48 hours of booking and check-in is at least 14 days away, you receive a full refund.",
      HOST_CANCELS,
    ],
  },
  {
    type: "nonrefundable",
    name: "Non-refundable",
    summary: "No refund if the guest cancels. Often paired with a lower price.",
    suits: "Like Booking.com's non-refundable rate. Guests expect a better price for it.",
    paragraphs: [
      "Non-refundable: the total price is not refunded if you cancel, change your dates, or don't arrive.",
      HOST_CANCELS,
    ],
  },
];

export const POLICY_CHOICES: { type: PolicyType; name: string }[] = [
  ...POLICY_PRESETS.map((p) => ({ type: p.type, name: p.name })),
  { type: "custom", name: "Write my own" },
];

export function isPolicyType(value: unknown): value is PolicyType {
  return typeof value === "string" && (POLICY_TYPES as readonly string[]).includes(value);
}

export function presetFor(type: string | null | undefined): PolicyPreset | undefined {
  return POLICY_PRESETS.find((p) => p.type === type);
}

/**
 * What to store when a host saves their choice: the policy type, their extra terms, and the final text
 * guests will read. Returns an error message when a "write my own" policy was left empty.
 */
export function policyFieldsToStore(input: {
  type: PolicyType;
  notes?: string | null;
  custom?: string | null;
}): { error: string } | { cancellationPolicyType: PolicyType; cancellationNotes: string | null; cancellationPolicy: string } {
  const text = composeCancellationPolicy(input);
  if (!text) return { error: "Write your cancellation terms, or choose one of the ready-made policies." };
  const notes = input.type === "custom" ? "" : (input.notes ?? "").trim();
  return { cancellationPolicyType: input.type, cancellationNotes: notes || null, cancellationPolicy: text };
}

/**
 * The text guests see. A ready-made policy is its wording plus the host's optional extra terms
 * (check-in times, damage, house rules). A custom policy is exactly what the host wrote.
 * Paragraphs are separated by a blank line, which is how the listing and booking pages split them.
 */
export function composeCancellationPolicy(input: {
  type: PolicyType;
  notes?: string | null;
  custom?: string | null;
}): string {
  if (input.type === "custom") return (input.custom ?? "").trim();
  const preset = presetFor(input.type);
  if (!preset) return (input.custom ?? "").trim();
  const extra = (input.notes ?? "").trim();
  return [...preset.paragraphs, ...(extra ? [extra] : [])].join("\n\n");
}
