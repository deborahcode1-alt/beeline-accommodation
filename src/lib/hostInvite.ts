import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// A newly approved host is sent a link to choose their own password, so no password is ever emailed.
// The link carries a random token; only its hash is kept, and it works once, for 7 days.

const INVITE_DAYS = 7;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** A password nobody knows, so the login cannot be used until the host sets their own. */
export function unusablePasswordHash() {
  return bcrypt.hash(randomBytes(24).toString("hex"), 10);
}

/** Makes a fresh set-password link for a host login and returns it. */
export async function createInviteLink(adminUserId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      inviteTokenHash: hashToken(token),
      inviteExpiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return `${SITE_URL}/set-password?token=${token}`;
}

/** The login behind a valid, unexpired invite token, or null. */
export async function findInvitedLogin(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const user = await prisma.adminUser.findFirst({
    where: { inviteTokenHash: hashToken(token), inviteExpiresAt: { gt: new Date() } },
    select: { id: true, email: true },
  });
  return user;
}
