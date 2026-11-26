import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Host agreement" };

export default function HostAgreementPage() {
  return (
    <LegalPage
      title="Host agreement"
      updated="November 2026"
      sections={[
        {
          heading: "The service",
          body: [
            "Book On Beeline provides hosts with a listing on the platform, a bookings dashboard and tools to contact guests. Book On Beeline does not take a commission on bookings. Hosts pay the subscription fee, and guests pay an admin service fee on instant bookings paid online (see \"Card payments through Stripe\").",
          ],
        },
        {
          heading: "Subscription",
          body: [
            "The fee depends on how many listings you have: A$100 per month for 1 to 3 listings, or A$200 per month for 4 to 10 listings. If you pay yearly you pay for 11 months instead of 12 (A$1,100 or A$2,200 a year), so one month is free. Fees are in Australian dollars, billed in advance by our payment provider. Hosts with more than 10 listings agree a custom plan with us. You can cancel at any time from your dashboard. Cancellation takes effect at the end of the period you have paid for. [Lawyer to confirm refund wording under the Australian Consumer Law.]",
            "Free trial: when you first subscribe you get 30 days free. You enter your card at the start, and your first payment is taken when the 30 days end unless you cancel before then. The free trial is available once per host. We may agree a different trial end date with you in writing.",
            "If a payment fails we will email you and allow [number] days to fix it. If the subscription lapses, your listings are removed from the platform. Your information is kept for [number] days so you can reactivate by paying.",
            "Bookings already confirmed when a listing is removed remain your responsibility to honour and you must tell affected guests.",
          ],
        },
        {
          heading: "Your listings",
          body: [
            "You confirm you own or are authorised to list each property, that descriptions, photos and prices are accurate and up to date, and that you hold any licences, insurance and approvals required for short-stay accommodation where you operate.",
            "You must have the right to use every photo you upload. Do not upload content that is misleading, offensive or unlawful.",
            "You give Book On Beeline a non-exclusive, royalty-free licence to display your listing text and photos on the Book On Beeline website and in related promotion of your listing, for as long as your listing is on the platform. You keep ownership of your content.",
          ],
        },
        {
          heading: "Bookings and payments",
          body: [
            "You decide for each listing whether bookings are instant or request-only, and you set your own prices and cancellation terms. Guests pay you directly, by bank transfer or, when card payments are switched on for your account, by card through Stripe. Book On Beeline does not hold guest money or resolve payment disputes.",
            "Keep your calendar accurate. If you use instant booking, you are responsible for honouring the bookings it confirms.",
            "Instant booking with card payments: when you use instant booking and card payments are switched on for your account, the guest pays by card at the time of booking. We hold their dates for 30 minutes while they pay. You see the booking only once it is paid. If they do not pay in time, the hold lapses and the dates become available again. If a payment arrives after the dates were released and the dates have since been taken, we refund the guest automatically.",
          ],
        },
        {
          heading: "Card payments through Stripe",
          body: [
            "This section applies when card payments are switched on for your account. Guests then pay by card through Stripe, and the payment goes directly to your own Stripe account. Book On Beeline never holds the guest's money.",
            "Your listing's cancellation policy applies to every booking, whether the guest pays by card or bank transfer. If a guest wants to cancel or change a booking, they contact you. You decide it under your policy and the law, and you pay any refund. A card refund goes back to the guest's card through Stripe. Any amount you keep must follow the policy shown when the guest booked. Book On Beeline does not hold guest money and, to the extent the law allows, takes no responsibility for cancellations or refunds.",
            "This does not limit anyone's rights under the Australian Consumer Law. If you cancel a booking, cannot provide the stay, or the listing is not as described, you must refund the guest promptly.",
            "You are the seller. You are responsible for refunds, payment disputes and chargebacks, and you settle them with the guest directly. Book On Beeline takes no commission and no deduction from your booking payment, and takes no part in refunds or cancellations. ",
            "Admin service fee for online bookings: Instant bookings paid through Book On Beeline include an admin service fee for online bookings of 2% of the booking price, paid by the guest in addition to the price of the stay. Booking requests, and bank transfers paid straight to you, do not include it. The fee is non-refundable, except if you cancel, you cannot provide the stay, or the law requires a refund. [To be confirmed: who receives the fee. Lawyer to confirm the fee and refund wording.]",
            "You must complete Stripe's setup and identity checks and keep your details correct. Stripe's terms apply to you.",
          ],
        },
        {
          heading: "Guest information",
          body: [
            "You may use guest details only to manage their booking and stay. Keep them private and secure, do not share them, and do not use them for marketing without the guest's consent.",
          ],
        },
        {
          heading: "Removal of listings",
          body: [
            "We may remove or suspend a listing that breaches this agreement, is inaccurate or unsafe, or generates serious complaints.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "You are responsible for your property, your guests' stay and your obligations as an accommodation provider. To the extent the law allows, Book On Beeline is not liable for losses arising from your listings or bookings. [Lawyer to complete indemnity and limitation clauses.]",
          ],
        },
        {
          heading: "Changes and governing law",
          body: [
            "We will give you notice of material changes to this agreement or the subscription fee. This agreement is governed by the laws of Queensland, Australia.",
          ],
        },
      ]}
    />
  );
}
