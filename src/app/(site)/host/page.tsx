import type { Metadata } from "next";
import Link from "next/link";
import { HostEnquiryForm } from "@/components/HostEnquiryForm";

export const metadata: Metadata = {
  title: "List your property",
  description:
    "List your accommodation on Beeline for a simple subscription. No commission, your own payment method, and guests contact you directly.",
};

const BENEFITS = [
  {
    title: "No commission",
    text: "Your only cost is a simple subscription. What guests pay goes to you.",
  },
  {
    title: "Your payment method",
    text: "Take payment the way you already do: Stripe, Square, PayPal or a direct bank deposit.",
  },
  {
    title: "Guests talk to you",
    text: "Your phone, email and website sit right on your listing, so guests can contact you directly.",
  },
  {
    title: "Instant or request",
    text: "Choose per listing: confirm bookings instantly, or review each request yourself.",
  },
  {
    title: "A bookings dashboard",
    text: "See the month ahead, a calendar, and call, text or email guests in one tap. Tick off payments as they arrive.",
  },
  {
    title: "Your own photos and story",
    text: "Upload your photos, describe your place and link your own website.",
  },
];

export default function HostPage() {
  return (
    <div>
      <section className="bg-soft">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            List your property on Beeline
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground/80">
            Get found by guests searching your area, and keep the booking relationship. Hosts pay
            a simple subscription instead of a commission.
          </p>
          <p className="mt-3 text-sm text-muted">
            Already a host?{" "}
            <Link href="/admin/login" className="font-semibold text-accent-deep hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title}>
              <h2 className="text-lg font-semibold">{b.title}</h2>
              <p className="mt-1 text-sm text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="apply" className="border-t border-card-border bg-soft">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <h2 className="text-2xl font-bold">Register your interest</h2>
          <p className="mt-2 text-sm text-muted">
            Tell us about your property and we&apos;ll be in touch about getting you listed.
            Subscription pricing will be confirmed when we speak.
          </p>
          <div className="mt-6">
            <HostEnquiryForm />
          </div>
        </div>
      </section>
    </div>
  );
}
