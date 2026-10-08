// The "About you and your place" subjects. Each is a dropdown on the host profile and
// shows as a short fact on every one of the host's listings.

export type ProfileOption = { value: string; label: string };
export type ProfileSubject = {
  key: "hostType" | "yearsHosting" | "livesOnSite" | "checkInStyle" | "responseTime";
  label: string; // the dropdown's heading in the form
  options: ProfileOption[];
};

export const PROFILE_SUBJECTS: ProfileSubject[] = [
  {
    key: "hostType",
    label: "Who is hosting",
    options: [
      { value: "INDIVIDUAL", label: "An individual host" },
      { value: "COUPLE", label: "A couple" },
      { value: "FAMILY", label: "A local family" },
      { value: "BUSINESS", label: "A business or property manager" },
    ],
  },
  {
    key: "yearsHosting",
    label: "Hosting for",
    options: [
      { value: "NEW", label: "New to hosting" },
      { value: "UNDER_1", label: "Less than a year" },
      { value: "1_TO_3", label: "1 to 3 years" },
      { value: "3_TO_5", label: "3 to 5 years" },
      { value: "5_PLUS", label: "More than 5 years" },
    ],
  },
  {
    key: "livesOnSite",
    label: "Where you live",
    options: [
      { value: "ON_SITE", label: "On the property" },
      { value: "NEARBY", label: "Nearby" },
      { value: "OFF_SITE", label: "Somewhere else" },
    ],
  },
  {
    key: "checkInStyle",
    label: "How guests check in",
    options: [
      { value: "IN_PERSON", label: "I meet guests in person" },
      { value: "KEY_BOX", label: "Key box or lock box" },
      { value: "SMART_LOCK", label: "Smart lock or door code" },
      { value: "KEY_COLLECT", label: "Collect the key from me" },
    ],
  },
  {
    key: "responseTime",
    label: "Usually replies",
    options: [
      { value: "WITHIN_HOUR", label: "Within an hour" },
      { value: "SAME_DAY", label: "The same day" },
      { value: "WITHIN_DAY", label: "Within a day" },
    ],
  },
];

// How each answer reads as a fact on a listing, e.g. "Hosting for 3 to 5 years".
const FACT_TEXT: Record<string, Record<string, string>> = {
  hostType: {
    INDIVIDUAL: "Individual host",
    COUPLE: "Hosted by a couple",
    FAMILY: "Local family host",
    BUSINESS: "Professional host",
  },
  yearsHosting: {
    NEW: "New to hosting",
    UNDER_1: "Hosting for under a year",
    "1_TO_3": "Hosting for 1 to 3 years",
    "3_TO_5": "Hosting for 3 to 5 years",
    "5_PLUS": "Hosting for over 5 years",
  },
  livesOnSite: {
    ON_SITE: "Lives on the property",
    NEARBY: "Lives nearby",
    OFF_SITE: "Lives elsewhere",
  },
  checkInStyle: {
    IN_PERSON: "Meets you in person",
    KEY_BOX: "Key box check-in",
    SMART_LOCK: "Smart lock check-in",
    KEY_COLLECT: "Collect the key from the host",
  },
  responseTime: {
    WITHIN_HOUR: "Usually replies within an hour",
    SAME_DAY: "Usually replies the same day",
    WITHIN_DAY: "Usually replies within a day",
  },
};

export const BLURB_MAX = 200;

type ProfileFacts = {
  hostType?: string | null;
  yearsHosting?: string | null;
  livesOnSite?: string | null;
  checkInStyle?: string | null;
  responseTime?: string | null;
  languages?: string | null;
};

/** The host's answers as short readable facts, in a fixed order. Unanswered subjects are skipped. */
export function profileFacts(host: ProfileFacts): string[] {
  const facts: string[] = [];
  for (const subject of PROFILE_SUBJECTS) {
    const answer = host[subject.key];
    const text = answer ? FACT_TEXT[subject.key]?.[answer] : undefined;
    if (text) facts.push(text);
  }
  if (host.languages?.trim()) facts.push(`Speaks ${host.languages.trim()}`);
  return facts;
}
