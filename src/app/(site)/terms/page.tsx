import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="October 2026"
      sections={[
        {
          heading: "Who we are",
          body: [
            "Beeline Accommodation (\"Beeline\", \"we\") operates this website, which helps guests find and contact independent accommodation hosts. Beeline is operated by [legal entity name], ABN [ABN].",
          ],
        },
        {
          heading: "What Beeline does and does not do",
          body: [
            "Beeline is an online directory and booking tool. Each listing is offered by an independent host. Any booking or stay is an arrangement between you and that host, not with Beeline.",
            "Beeline does not own, manage or inspect the accommodation, and does not take a commission on bookings. Hosts are responsible for the accuracy of their listings, the condition and safety of their property, and any licences or approvals they need.",
          ],
        },
        {
          heading: "Making a booking",
          body: [
            "Some listings confirm a booking immediately when you submit it. Others are requests that the host accepts or declines. We will tell you which applies before you submit.",
            "The host's own cancellation and payment terms are shown on the listing and when you book. By submitting a booking you agree to them. Nothing in these terms limits your rights under the Australian Consumer Law.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "Payment is made to the host using the method the host provides. Beeline does not hold or process guest payments. Check the payment details with the host before you pay.",
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
            "If you have a problem with a listing or a host, contact the host first. If it is not resolved, contact us at [contact email] and we will review it and may remove a listing that breaches our rules.",
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
