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
          heading: "Who we are and these terms",
          body: [
            `1.1 Book On Beeline (bookonbeeline.com) is operated by [trustee's full legal name] as trustee for The Opal Trust, ABN 79 778 523 721 ("Book On Beeline", "we", "us", "our").`,
            `1.2 These terms apply to anyone who uses the website, creates an account, contacts a host or makes a booking ("you"). Hosts are also bound by our separate [Host Agreement](https://bookonbeeline.com/host-agreement).`,
            "1.3 By using the website or making a booking, you agree to these terms and our Privacy Policy. If you do not agree, please do not use the website.",
            "1.4 You must be 18 or older to create an account or make a booking. If you book for other people, you confirm you have their permission and that everyone in your group will follow the host's terms and house rules.",
            "1.5 Nothing in these terms excludes, restricts or changes any right or remedy you have under the Australian Consumer Law or any other law that cannot be excluded.",
          ],
        },
        {
          heading: "Words we use",
          body: [
            "• Host: the independent person or business that offers a property on the website.",
            "• Listing: a host's page describing a property, its price, availability and conditions.",
            "• Booking: an agreement between you and a host for a stay, made through the website.",
            "• Instant booking: a booking that is confirmed as soon as payment is made.",
            "• Booking request: a request the host can accept or decline.",
            "• Host terms: the host's cancellation policy, house rules, check-in details, bond and other conditions shown on the listing and at booking.",
          ],
        },
        {
          heading: "What Book On Beeline does and does not do",
          body: [
            "3.1 Book On Beeline is an online directory and booking tool for short-term stays in regional Australia. Hosts pay us a subscription to list their property. We do not take a commission on bookings. Any fee that applies to a booking is dealt with in clause 6.",
            "3.2 Each booking is a contract between you and the host only. We are not a party to it, we are not the host's or your agent, and we are not a travel agent or tour operator.",
            "3.3 We do not own, manage, inspect or control any property. The host is solely responsible for:",
            "• the accuracy of the listing, including photos, descriptions, facilities, prices and availability",
            "• the condition, cleanliness and safety of the property",
            "• any licences, council approvals, body corporate permissions and insurance the property needs",
            "• their host terms, any bond, and any taxes (including GST) on the price",
            "3.4 Listings are shown by area and availability, generally with the lowest price first. Hosts cannot pay for a better position. You can search and filter to change what you see.",
            "3.5 Distances, maps and similar details are a guide only. Check anything that matters to you with the host before you book.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "4.1 Give accurate, current details when you register or book, including your name, email and phone number. The host relies on them to contact you.",
            "4.2 Keep your login private. You are responsible for activity on your account. Tell us straight away at bookonbeeline@gmail.com if you think someone else has used it.",
            "4.3 We may suspend or close an account that breaks these terms, makes false bookings or is used fraudulently.",
          ],
        },
        {
          heading: "Making a booking",
          body: [
            "5.1 Some listings are instant bookings. Others are booking requests that the host accepts or declines. We show which applies before you submit.",
            "5.2 Instant bookings paid by card. When you submit, we hold your dates for 30 minutes while you pay. Your booking is confirmed when the payment goes through. If you do not pay in time, the hold ends, the dates are released and you are not charged. If your payment arrives after the hold has ended and the dates have been booked by someone else, your payment is refunded in full.",
            "5.3 Booking requests. You are not charged when you send a request. If the host accepts, you will receive payment instructions. Pay by the date the host gives you; if you do not, the host may release the dates.",
            "5.4 A booking is confirmed when you receive a confirmation from us or the host. Check the dates, number of guests and price, and tell the host straight away if anything is wrong.",
            "5.5 The host terms shown on the listing and at booking form part of your contract with the host. By booking, you agree to them. If a host term conflicts with the Australian Consumer Law, the law applies.",
            "5.6 Send special requests (early check-in, accessibility needs, pets, extra guests) to the host before you book. The host decides whether to agree, and may charge for them.",
            "5.7 If a listing shows an obvious mistake, such as a price that is clearly wrong, the host may decline or cancel the booking and refund any amount you paid in full.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "6.1 You pay the host directly, up front, using a method the host offers: bank transfer, card, or both. Instant bookings paid at the time of booking are card only.",
            "6.2 Bank transfer. Pay only into the account shown in your booking confirmation or on the website. Before paying, confirm the bank details with the host by phone. Scammers sometimes send emails or texts with \"updated\" bank details. We will never ask you to pay into a different account by email or text.",
            "6.3 Card. Card payments are processed by Stripe on behalf of the host. We do not see or store your full card number. [Lawyer and Stripe setup to confirm: Stripe Connect, with the host as the merchant.]",
            "6.4 Any fee added to your booking is shown to you, with the total price, before you pay.",
            "6.5 [Proposed, not yet charged. To be confirmed before it applies:] Bookings made through Book On Beeline incur a 2% administration fee. Contact the host directly to avoid this fee.",
            "6.6 Book On Beeline does not keep any part of what you pay for your stay. [Confirm once it is decided who receives the administration fee.]",
            "6.7 Prices include GST where the host is registered for GST. Any bond, cleaning fee, pet fee or other charge must be shown on the listing. The host collects and returns any bond under their host terms.",
          ],
        },
        {
          heading: "Cancellations, changes and refunds",
          body: [
            "7.1 Each host sets their own cancellation policy. It applies to every booking, whether you pay by card or bank transfer, and is shown on the listing and before you book or pay. Please read it before you book.",
            "7.2 To cancel or change a booking, contact the host. Where your booking page shows a cancel or change option, you can also use it. Cancelling does not by itself pay a refund.",
            "7.3 Refunds are arranged between you and the host, worked out under the host's cancellation policy and the law, and paid by the host. A card refund goes back to the card you paid with through Stripe, usually within 5 to 10 business days after the host processes it. A bank transfer refund is paid by the host into the account you nominate.",
            "7.4 Book On Beeline does not hold your money and does not decide or pay refunds (apart from the automatic refund in clause 5.2). To the extent the law allows, we are not responsible for a host's cancellations, changes or refunds. This does not limit our responsibility for our own negligence, our breach of these terms or our breach of the law. If you cannot reach agreement with a host, see clause 16.",
            "7.5 If the host cancels, or cannot provide the stay, or the property is significantly different from the listing, you are entitled to a full refund from the host of what you paid for the stay. You may also have other rights under the Australian Consumer Law.",
            "7.6 Any amount a host keeps when you cancel must follow the policy shown when you booked and must be allowed by law.",
            "7.7 A listing may offer a non-refundable or discounted rate, which must be clearly marked before you book. Your rights under the Australian Consumer Law still apply.",
            "7.8 Late arrival and no-shows. If you will arrive late or a day later, tell the host as soon as you can. If you do not arrive and have not told the host, the host's no-show policy applies.",
            "7.9 Floods, fires and road closures. If an event such as flooding, bushfire or a road closure affects your stay, contact the host. The host's cancellation policy applies unless the host cannot provide the stay (clause 7.5). We recommend travel insurance that covers cancellation.",
          ],
        },
        {
          heading: "Your responsibilities as a guest",
          body: [
            "8.1 During your stay you agree to:",
            "• follow the host terms and house rules, including guest numbers, pets, smoking, noise and parties",
            "• treat the property, neighbours and the host's animals with respect",
            "• leave the property in the condition you found it, apart from normal use",
            "• tell the host promptly about any damage, breakage or safety issue",
            "8.2 You are responsible to the host for damage caused by you or your group, as set out in the host terms and the law.",
            "8.3 Many listings are rural properties or farm stays. They may have livestock, dams, machinery, unfenced areas, wildlife and unsealed roads. Follow the host's safety instructions and supervise children at all times.",
            "8.4 You are responsible for your own travel arrangements and insurance. We recommend travel insurance that covers cancellation, illness, injury and loss of belongings.",
          ],
        },
        {
          heading: "Contacting hosts",
          body: [
            "9.1 You may contact a host about their listing or your booking. Please be respectful.",
            "9.2 Do not use a host's contact details for marketing, spam or anything unrelated to a stay.",
            "9.3 Messages and booking details sent through the website may be stored so we can run the service and help with complaints.",
          ],
        },
        {
          heading: "Content you submit",
          body: [
            "10.1 You keep ownership of content you submit. You give us a non-exclusive, royalty-free licence to display it on the website and use it to promote Book On Beeline. You confirm you have the right to share it.",
            "10.2 We may remove content that breaks these terms or the law.",
          ],
        },
        {
          heading: "Using the website",
          body: [
            "You must not:",
            "• make false, speculative or fraudulent bookings",
            "• impersonate anyone or give false details",
            "• copy, scrape or reuse listings or other content for commercial use without our written permission",
            "• try to access the website, accounts or systems without permission, or get around security features",
            "• upload viruses or harmful code, or do anything that overloads or disrupts the website",
            "• use the website for anything unlawful",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "12.1 The website, its design, software and our own content belong to us or our licensors.",
            "12.2 Listing photos and descriptions belong to the hosts who supplied them. You may view and share listing links for personal use only.",
          ],
        },
        {
          heading: "Privacy",
          body: [
            "13.1 We handle personal information under our [Privacy Policy](https://bookonbeeline.com/privacy) and the Privacy Act 1988 (Cth).",
            "13.2 When you make a booking or send a message, we share your name, contact details and booking details with the host so they can manage your stay. The host is responsible for how they handle your information after that.",
          ],
        },
        {
          heading: "Our responsibility to you",
          body: [
            "14.1 Our services come with guarantees that cannot be excluded under the Australian Consumer Law. Nothing in this clause limits them.",
            "14.2 We will use reasonable care and skill in running the website and booking tool. We do not promise it will always be available, error-free or free of viruses.",
            "14.3 Because the stay is provided by the host, not by us, and to the extent the law allows, we are not responsible for:",
            "• the property, the stay, or anything the host or other guests do or fail to do",
            "• information in a listing supplied by a host",
            "• a host cancelling, refusing a refund or not returning a bond",
            "• loss, injury or damage at or near a property",
            "This does not apply to the extent the loss is caused by our own negligence or breach of these terms.",
            "14.4 To the extent the law allows, we are not liable for indirect or consequential loss, such as lost travel costs, lost income or lost enjoyment, arising from your use of the website.",
            "14.5 Where the law lets us limit our liability for a failure to meet a consumer guarantee, our liability is limited to supplying the service again or paying the cost of having it supplied again. Otherwise, and to the extent the law allows, our total liability to you is limited to AUD $100. [Lawyer to confirm.]",
          ],
        },
        {
          heading: "Your responsibility to us",
          body: [
            "If you break these terms or the law while using the website, you are responsible for the reasonable loss this causes us, to the extent you caused it. [Lawyer to confirm.]",
          ],
        },
        {
          heading: "Complaints",
          body: [
            "16.1 If you have a problem with a listing, a stay or a refund, contact the host first. Most problems can be sorted out this way.",
            "16.2 If it is not resolved, email us at bookonbeeline@gmail.com with your booking details. We will acknowledge your complaint within 5 business days and review it. We may help you contact the host, ask the host to respond, or suspend or remove a listing that breaks our rules.",
            "16.3 We cannot make a host give a refund. If a dispute with a host is still not resolved, you can contact the [Office of Fair Trading Queensland](https://www.qld.gov.au/law/fair-trading) or the fair trading office in your state, or apply to the Queensland Civil and Administrative Tribunal (QCAT).",
          ],
        },
        {
          heading: "Suspending or removing access",
          body: [
            "We may suspend or close your account, cancel a pending booking request, or block access to the website if you break these terms, act fraudulently or put hosts or other users at risk. Where reasonable, we will tell you why.",
          ],
        },
        {
          heading: "Events outside our control",
          body: [
            "We are not responsible for delays or failures caused by events outside our reasonable control, such as floods, fires, storms, power or internet outages, cyber attacks, pandemics or government directions. This does not change a host's obligations to you under clause 7.",
          ],
        },
        {
          heading: "Changes to these terms",
          body: [
            "19.1 We may update these terms from time to time. The current version is always on this page, with the date it was last updated.",
            "19.2 The version in force when you made a booking applies to that booking. If we make a significant change, we will tell account holders by email or on the website.",
          ],
        },
        {
          heading: "General",
          body: [
            "20.1 These terms are governed by the laws of Queensland, Australia. You and we agree to the jurisdiction of the courts and tribunals of Queensland, but this does not stop you using any consumer rights or forums available in your own state.",
            "20.2 If part of these terms cannot be enforced, the rest still applies.",
            "20.3 If we do not enforce a right straight away, we can still enforce it later.",
            "20.4 These terms, our Privacy Policy and the host terms for your booking are the whole agreement about your use of the website.",
          ],
        },
        {
          heading: "Contact us",
          body: [
            "[Trustee's full legal name] as trustee for The Opal Trust, trading as Book On Beeline, ABN 79 778 523 721.",
            "[Postal address]",
            "Email: bookonbeeline@gmail.com",
          ],
        },
      ]}
    />
  );
}
