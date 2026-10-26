import { Resend } from "resend";

// Email goes out through Resend (resend.com). To turn it on, verify the site's domain in Resend and set
// RESEND_API_KEY and RESEND_FROM_EMAIL (an address on that domain, since Resend cannot send from a
// Gmail address). Optionally set RESEND_REPLY_TO (for example bookonbeeline@gmail.com) so that when
// someone replies to a booking email, the reply lands in that inbox. Until it is set up, callers
// should treat a thrown error here as "not configured yet" rather than a hard failure.

export function isEmailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error(
      "Email isn't configured yet — set RESEND_API_KEY and RESEND_FROM_EMAIL to enable it."
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
  });

  if (error) {
    throw new Error(`Resend request failed: ${error.message}`);
  }
}
