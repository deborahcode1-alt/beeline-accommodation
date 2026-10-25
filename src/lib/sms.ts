// Text messages go out through ClickSend (clicksend.com), an Australian SMS provider.
// To switch texting on, create a ClickSend account, then set these in the environment:
//   CLICKSEND_USERNAME  the account username (usually the email you signed up with)
//   CLICKSEND_API_KEY   an API key from the ClickSend dashboard
//   CLICKSEND_FROM      optional: a dedicated number, or an alphanumeric sender name that has been
//                       registered with ClickSend. Leave it out to use ClickSend's shared number.
// Until the first two are set, sendSms throws and callers treat that as "texting not set up yet".

const API_URL = process.env.CLICKSEND_API_URL || "https://rest.clicksend.com/v3/sms/send";

export function isSmsConfigured() {
  return !!(process.env.CLICKSEND_USERNAME && process.env.CLICKSEND_API_KEY);
}

/** Tidy a phone number the way people type it: spaces, dashes and brackets removed. */
export function cleanPhone(phone: string) {
  const compact = phone.replace(/[\s\-().]/g, "");
  return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
}

// What ClickSend reports per message, in words a host can act on.
const FAILURES: Record<string, string> = {
  INVALID_RECIPIENT: "That phone number doesn't look valid.",
  INSUFFICIENT_CREDIT: "The ClickSend account is out of credit. Top it up and try again.",
  INVALID_SENDER_ID: "The text sender name isn't registered with ClickSend.",
  COUNTRY_NOT_ENABLED: "ClickSend isn't enabled to text that country.",
  BLOCKED: "That number can't be texted (it may have opted out).",
};

export async function sendSms(to: string, body: string): Promise<void> {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  const from = process.env.CLICKSEND_FROM;

  if (!username || !apiKey) {
    throw new Error(
      "Texting isn't configured yet — set CLICKSEND_USERNAME and CLICKSEND_API_KEY to enable it."
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          source: "beeline",
          body,
          to: cleanPhone(to),
          // Lets guests' local numbers (04xx xxx xxx) work without a +61 prefix.
          country: "AU",
          ...(from ? { from } : {}),
        },
      ],
    }),
  });

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    throw new Error("ClickSend rejected the username or API key.");
  }
  if (!res.ok) {
    const detail = typeof data?.response_msg === "string" ? data.response_msg : `HTTP ${res.status}`;
    throw new Error(`ClickSend request failed: ${detail}`);
  }

  // The request can succeed while the individual text does not, so check the message itself.
  const message = data?.data?.messages?.[0];
  if (!message || message.status !== "SUCCESS") {
    const status = String(message?.status ?? data?.response_code ?? "UNKNOWN");
    throw new Error(`ClickSend could not send the text: ${FAILURES[status] ?? status}`);
  }
}

export function bookingConfirmationMessage(params: {
  guestName: string;
  listingName: string;
  checkIn: Date;
  checkOut: Date;
  siteName: string;
}) {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-AU", { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
  const firstName = params.guestName.split(" ")[0] || params.guestName;
  return (
    `Hi ${firstName}, your booking at ${params.listingName} (${fmt(params.checkIn)} - ` +
    `${fmt(params.checkOut)}) is confirmed! - ${params.siteName}`
  );
}
