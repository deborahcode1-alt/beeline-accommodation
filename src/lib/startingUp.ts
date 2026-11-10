import { prisma } from "@/lib/prisma";
import { STARTING_UP_MONTHS } from "@/lib/pricing";
import { startingUpOffered } from "@/lib/settings";

// "Starting up": a free tier for new hosts, 3 months, no card. Their listings stay visible. When the period
// ends nothing happens by itself: the owner sees it on the Hosts page and invites them to subscribe.

type HostFacts = {
  subscriptionStatus: string;
  stripeSubscriptionId: string | null;
  startingUpAt: Date | null;
  trialUsedAt: Date | null;
};

/** Whether this host may choose Starting up: a host who has not paid or trialled before, while it is offered. */
export function canChooseStartingUp(host: HostFacts, offered: boolean) {
  return (
    offered &&
    host.subscriptionStatus === "TRIAL" &&
    !host.stripeSubscriptionId &&
    !host.startingUpAt &&
    !host.trialUsedAt
  );
}

/** On Starting up right now (chosen, and not yet moved on to a paid subscription). */
export function isOnStartingUp(host: { startingUpAt: Date | null; stripeSubscriptionId: string | null }) {
  return !!host.startingUpAt && !host.stripeSubscriptionId;
}

/** Whole days from now until a date; negative once it has passed. */
export function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function addMonths(from: Date, months: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Puts a host on the Starting up tier for 3 months. Throws a plain-language message when they cannot. */
export async function startStartingUp(hostId: string) {
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) throw new Error("Host not found.");
  if (host.subscriptionStatus === "COMPLIMENTARY") {
    throw new Error("These listings belong to the platform owner, so no subscription is needed.");
  }
  if (isOnStartingUp(host)) throw new Error("You are already on Starting up.");
  if (!(await startingUpOffered())) throw new Error("Starting up isn't being offered right now.");
  if (!canChooseStartingUp(host, true)) {
    throw new Error("Starting up is for new hosts who haven't subscribed or had a free trial yet.");
  }
  const now = new Date();
  await prisma.host.update({
    where: { id: host.id },
    data: {
      startingUpAt: now,
      startingUpEndsAt: addMonths(now, STARTING_UP_MONTHS),
      subscriptionStatus: "TRIAL",
      // No end date on the trial itself: the listings stay visible until the owner acts.
      trialEndsAt: null,
    },
  });
}
