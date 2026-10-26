import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Host agreement" };

export default function HostAgreementPage() {
  return (
    <LegalPage
      title="Host agreement"
      updated="October 2026"
      sections={[
        {
          heading: "The service",
          body: [
            "Beeline provides hosts with a listing on the platform, a bookings dashboard and tools to contact guests. Beeline does not take a commission on bookings. The only charge is the subscription fee.",
          ],
        },
        {
          heading: "Subscription",
          body: [
            "The fee depends on how many listings you have: A$100 per month for 1 to 3 listings, or A$200 per month for 4 to 10 listings. If you pay yearly you pay for 11 months instead of 12 (A$1,100 or A$2,200 a year), so one month is free. Fees are in Australian dollars, billed in advance by our payment provider. Hosts with more than 10 listings agree a custom plan with us. You can cancel at any time from your dashboard. Cancellation takes effect at the end of the period you have paid for. [Lawyer to confirm refund wording under the Australian Consumer Law.]",
            "If a payment fails we will email you and allow [number] days to fix it. If the subscription lapses, your listings are removed from the platform. Your information is kept for [number] days so you can reactivate by paying.",
            "Bookings already confirmed when a listing is removed remain your responsibility to honour and you must tell affected guests.",
          ],
        },
        {
          heading: "Your listings",
          body: [
            "You confirm you own or are authorised to list each property, that descriptions, photos and prices are accurate and up to date, and that you hold any licences, insurance and approvals required for short-stay accommodation where you operate.",
            "You must have the right to use every photo you upload. Do not upload content that is misleading, offensive or unlawful.",
          ],
        },
        {
          heading: "Bookings and payments",
          body: [
            "You decide for each listing whether bookings are instant or request-only, and you set your own prices and cancellation terms. Guests pay you directly using the method you provide. Beeline does not hold guest money or resolve payment disputes.",
            "Keep your calendar accurate. If you use instant booking, you are responsible for honouring the bookings it confirms.",
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
            "You are responsible for your property, your guests' stay and your obligations as an accommodation provider. To the extent the law allows, Beeline is not liable for losses arising from your listings or bookings. [Lawyer to complete indemnity and limitation clauses.]",
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
