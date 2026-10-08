import type { Guest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { generateCode, hashCode, CODE_TTL_MS, MAX_CODE_ATTEMPTS } from "@/lib/verificationCode";
import { SITE_NAME } from "@/lib/site";

/** Email a fresh 6-digit code to the guest and remember its hash. Throws a readable error if email can't be sent. */
export async function sendGuestCode(guest: Guest, purpose: "verify" | "reset") {
  if (!isEmailConfigured()) {
    throw new Error("Email is not set up yet, so a code can't be sent.");
  }
  const code = generateCode();
  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      pendingCodeHash: hashCode(code),
      pendingCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      pendingCodeAttempts: 0,
    },
  });
  await sendEmail({
    to: guest.email,
    subject: purpose === "verify" ? `Verify your ${SITE_NAME} email` : `Reset your ${SITE_NAME} password`,
    text:
      `Your code is ${code}. It expires in 10 minutes.` +
      (purpose === "verify"
        ? ` Enter it on your account page to verify your email.`
        : ` Enter it on the reset password page. If you did not ask for this, you can ignore this email.`),
  });
}

export type CodeCheck = { ok: true } | { ok: false; error: string };

/** Check a submitted code. Counts wrong attempts and locks the code after too many. */
export async function checkGuestCode(guest: Guest, code: string): Promise<CodeCheck> {
  if (!guest.pendingCodeHash || !guest.pendingCodeExpiresAt) {
    return { ok: false, error: "No code was requested. Ask for a new one." };
  }
  if (guest.pendingCodeExpiresAt < new Date()) {
    return { ok: false, error: "That code has expired. Ask for a new one." };
  }
  if (guest.pendingCodeAttempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Ask for a new code." };
  }
  if (hashCode(code.trim()) !== guest.pendingCodeHash) {
    await prisma.guest.update({
      where: { id: guest.id },
      data: { pendingCodeAttempts: { increment: 1 } },
    });
    return { ok: false, error: "That code is not right." };
  }
  return { ok: true };
}

export const clearCode = {
  pendingCodeHash: null,
  pendingCodeExpiresAt: null,
  pendingCodeAttempts: 0,
};
