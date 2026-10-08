# Beeline Accommodation

A directory and direct-booking platform for local accommodation hosts. Guests
search an area (for example Gympie) and land on that area's page, "Gympie
Accommodation", where they can filter stays, contact the host directly, and
either book instantly or send a booking request. Hosts get their own sign-in,
bookings dashboard and calendar, and pay a simple subscription instead of a
commission.

Tagline: "A Direct Route to Your Next Stay". Slogan: "Stay Local. Book Direct."

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Neon)
- Vercel (hosting, Blob for photos)
- Resend (email), Twilio (text messages, optional)
- `ical-generator` / `node-ical` for two-way calendar sync with Airbnb,
  Booking.com and other platforms
- Cookie-based admin session; hosts only ever see their own listings and
  bookings, the platform owner and collaborators see everything

## Getting started

```bash
npm install
cp .env.example .env   # then edit the values
npm run db:migrate
npm run db:seed
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin/login` for sign-in (the first owner login comes
from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`, applied by `db:seed`).

## Roles

- **Owner / collaborator** (no host attached): sees every host, listing and
  booking, and manages hosts, areas, subscriptions and team sign-ins. Add
  collaborators from the Team page.
- **Host**: sees only their own listings, bookings, messages and profile.

## Calendar sync

Each listing has an export URL (paste it into other platforms so direct
bookings block those dates) and any number of import URLs (so bookings made
elsewhere block the dates here). For hands-off syncing, hit
`GET /api/cron/sync-ical?secret=<CRON_SECRET>` on a schedule.

## Not switched on yet

- Stripe subscription billing (`src/lib/billing.ts` is a stub until keys exist)
- Square checkout per host (`src/lib/payments.ts`)
- Text messages until Twilio credentials are set
- Email to anyone but the Resend account owner until a sending domain is
  verified
- The terms, privacy policy and host agreement pages are drafts pending legal
  review
