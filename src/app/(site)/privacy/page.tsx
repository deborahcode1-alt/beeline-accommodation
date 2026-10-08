import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="October 2026"
      sections={[
        {
          heading: "About this policy",
          body: [
            "This policy explains how Beeline Accommodation (operated by [legal entity name], ABN [ABN]) collects, uses and protects personal information, in line with the Australian Privacy Principles.",
          ],
        },
        {
          heading: "What we collect",
          body: [
            "Guests: name, email, phone number, travel dates, number of guests and any message you send when you make a booking request or contact a host.",
            "Hosts: name, email, phone, business details, property information, photos, and subscription and billing details. Card details are handled by our payment provider and are not stored by us.",
            "Everyone: technical data such as device type and pages visited, which we use to keep the site working and improve it.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To pass your booking request or message to the right host, send confirmations and reminders, run host subscriptions, prevent misuse, and meet legal obligations.",
            "We only send marketing messages with your consent, and every marketing message includes a way to unsubscribe. Booking and account messages are not marketing.",
          ],
        },
        {
          heading: "Who sees it",
          body: [
            "A guest's details are shared with the host of the listing they contact or book, so the host can respond and look after the stay. Hosts must keep guest details private and use them only for that purpose.",
            "We use service providers to run the site, including hosting, email, text messaging, payments and subscriptions. They only receive what they need to provide their service, and some may store data outside Australia.",
          ],
        },
        {
          heading: "Keeping it safe",
          body: [
            "We use encrypted connections, protected logins and access controls so hosts can only see their own bookings. No system is perfectly secure. If a breach is likely to cause serious harm we will notify affected people and the regulator as required.",
          ],
        },
        {
          heading: "Your choices and rights",
          body: [
            "You can ask to see or correct the personal information we hold, or ask us to delete it where the law allows, by contacting [contact email]. If you are unhappy with our response you can complain to the Office of the Australian Information Commissioner.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use essential cookies to keep hosts signed in. [Update this section if analytics or advertising cookies are added.]",
          ],
        },
      ]}
    />
  );
}
