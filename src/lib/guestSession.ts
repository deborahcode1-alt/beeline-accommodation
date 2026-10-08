import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Guest sessions are signed with a different secret from admin sessions, so a guest's cookie
// can never be accepted as an admin or host session (even if the emails matched).
const COOKIE_NAME = "guest_session";
const secret = () => new TextEncoder().encode(`${process.env.SESSION_SECRET}|guest`);

export async function createGuestSession(guestId: string) {
  const token = await new SignJWT({ guestId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyGuestSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** The signed-in guest (fresh from the database), or null. */
export async function getGuest() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.guestId !== "string") return null;
    return await prisma.guest.findUnique({ where: { id: payload.guestId } });
  } catch {
    return null;
  }
}

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

/** Only allow sign-in redirects to pages on this site. */
export function safeNext(next: unknown, allowedPrefixes: string[]) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return null;
  return allowedPrefixes.some((p) => next === p || next.startsWith(`${p}/`) || next.startsWith(`${p}?`))
    ? next
    : null;
}
