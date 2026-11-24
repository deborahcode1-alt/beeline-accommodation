import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="November 2026"
      sections={[
        {
          heading: "Who we are",
          body: [
            "Book On Beeline (\"we\") operates this website, which helps guests find and contact independent accommodation hosts. Book On Beeline is operated by The Trustee for The Opal Trust, ABN 79 778 523 721.",
          ],
        },
        {
          heading: "What Book On Beeline does and does not do",
          body: [
            "Book On Beeline is an online directory and booking tool. Each listing is offered by an independent host. Any booking or stay is an arrangement between you and that host, not with Book On Beeline.",
            "Book On Beeline does not own, manage or inspect the accommodation, and does not take a commission on bookings. Hosts are responsible for the accuracy of their listings, the condition and safety of their property, and any licences or approvals they need.",
          ],
        },
        {
          heading: "Making a booking",
          body: [
            "Some listings are instant bookings. Others are requests that the host accepts or declines. We will tell you which applies before you submit.",
            "Instant bookings that are paid by card: you pay by card straight away. When you submit, we hold your dates for 30 minutes while you pay. Your booking is confirmed when the payment goes through. If you do not pay in time, the hold ends, the dates are released, you are not charged, and you will need to book again. If your payment arrives after the hold ended and the dates have been taken by someone else, your payment is refunded in full.",
            "The host's payment and cancellation terms are shown on the listing and when you book. For bookings paid by bank transfer, the host's cancellation terms apply. For bookings paid by card, the card payment terms below apply instead. Nothing in these terms limits your rights under the Australian Consumer Law.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "Payment is made up front, to the host, using a method the host offers. This is a direct bank transfer to the host's account, a card payment, or both. Instant bookings that are paid at the time of booking are card only. Check the payment details with the host before you pay.",
            "Bank transfers have no service fee. Card payments are processed securely by Stripe and have a service fee added to cover the cost of processing the card. The service fee is shown to you before you pay and appears as its own line on your invoice and receipt. Paying by bank transfer avoids it.",
            "Book On Beeline does not take a commission on bookings and does not keep any part of what you pay for your stay. For bookings paid by bank transfer, refunds follow the host's cancellation terms shown when you book.",
            "Card payments are final: there is no refund policy for a booking paid by card, and the host's cancellation terms do not apply to it. You are asked to agree to this before you pay. If something changes, contact your host, who can arrange a refund or a change. This does not limit your rights under the Australian Consumer Law, and if the host cancels, cannot provide the stay or the listing is not as described, you are entitled to a refund from the host. [Lawyer to confirm service fee and refund wording, including whether the service fee counts as a card surcharge under Australian rules.]",
          ],
        },
        {
          heading: "Contacting hosts",
          body: [
            "You may contact a host about their listing. Please be respectful and do not use host contact details for unrelated marketing.",
          ],
        },
        {
          heading: "Using the website",
          body: [
            "Do not misuse the site, attempt to access it without permission, submit false bookings, or copy its content for commercial use without our written consent.",
          ],
        },
        {
          heading: "Our responsibility",
          body: [
            "We take reasonable care to keep the site accurate and available but do not guarantee it will always be error-free or uninterrupted. To the extent the law allows, we are not liable for loss arising from a stay, a host's conduct, or listing information supplied by a host. [Lawyer to confirm wording.]",
          ],
        },
        {
          heading: "Complaints",
          body: [
            "If you have a problem with a listing or a host, contact the host first. If it is not resolved, contact us at bookonbeeline@gmail.com and we will review it and may remove a listing that breaches our rules.",
          ],
        },
        {
          heading: "Changes and governing law",
          body: [
            "We may update these terms. The version on this page applies. These terms are governed by the laws of Queensland, Australia.",
          ],
        },
      ]}
    />
  );
}
