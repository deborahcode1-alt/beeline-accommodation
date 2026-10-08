// Host subscriptions are billed through Stripe Billing on the platform's own Stripe account
// (not Connect: guest payments go to hosts by their own methods). Stripe isn't connected yet.
// To turn it on: set STRIPE_SECRET_KEY plus STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY, then
// implement the two functions below (Checkout session for sign-up, Customer Portal for
// updating a card or cancelling) and a webhook that updates Host.subscriptionStatus.

export type Plan = "monthly" | "yearly";

export function isBillingConfigured() {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_MONTHLY &&
    process.env.STRIPE_PRICE_YEARLY
  );
}

export async function createCheckoutSession(_params: {
  hostId: string;
  plan: Plan;
}): Promise<{ url: string }> {
  void _params;
  if (!isBillingConfigured()) {
    throw new Error("Billing isn't switched on yet. Stripe has not been connected.");
  }
  throw new Error("createCheckoutSession is not implemented yet.");
}

export async function createPortalSession(_params: {
  hostId: string;
}): Promise<{ url: string }> {
  void _params;
  if (!isBillingConfigured()) {
    throw new Error("Billing isn't switched on yet. Stripe has not been connected.");
  }
  throw new Error("createPortalSession is not implemented yet.");
}
