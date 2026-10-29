import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Billing isn't switched on yet. Stripe has not been connected.");
  client ??= new Stripe(key);
  return client;
}
