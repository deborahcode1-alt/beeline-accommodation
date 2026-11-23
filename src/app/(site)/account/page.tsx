import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGuest } from "@/lib/guestSession";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VerifyEmailBanner } from "@/components/guest/VerifyEmailBanner";
import { SignOutButton, ChangePasswordBox } from "@/components/guest/GuestAccountActions";
import { InstallAppButton } from "@/components/InstallAppButton";

export const metadata: Metadata = { title: "My stays", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const guest = await getGuest();
  if (!guest) redirect("/sign-in?next=/account");

  // Stays linked to the account, plus (only once the email is verified) any booked with that email.
  const stays = await prisma.booking.findMany({
    where: {
      OR: [
        { guestAccountId: guest.id },
        ...(guest.emailVerifiedAt
          ? [{ guestEmail: { equals: guest.email, mode: "insensitive" as const } }]
          : []),
      ],
    },
    orderBy: { checkIn: "asc" },
    include: {
      listing: {
        select: {
          name: true,
          slug: true,
          host: { select: { name: true, publicPhone: true, publicEmail: true } },
        },
      },
    },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const nowMs = new Date().getTime();
  // Pay at booking: an unpaid hold is "awaiting payment" while its 30 minutes run, then it has ended.
  const holdState = (s: (typeof stays)[number]): "active" | "ended" | null => {
    if (!s.holdExpiresAt || s.paymentStatus !== "UNPAID") return null;
    if (s.status === "PENDING") return s.holdExpiresAt.getTime() > nowMs ? "active" : "ended";
    if (s.status === "CANCELLED") return "ended";
    return null;
  };
  const isLive = (s: (typeof stays)[number]) =>
    s.checkOut >= today && s.status !== "CANCELLED" && s.status !== "DECLINED" && holdState(s) !== "ended";
  const upcoming = stays.filter(isLive);
  const past = stays.filter((s) => !isLive(s)).reverse();

  function StayCard({ s }: { s: (typeof stays)[number] }) {
    const phone = s.listing.host?.publicPhone?.replace(/[^\d+]/g, "");
    const hold = holdState(s);
    return (
      <div className="rounded-xl border border-card-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link href={`/listings/${s.listing.slug}`} className="font-semibold hover:underline">
              {s.listing.name}
            </Link>
            <p className="text-sm text-muted">
              {formatDate(s.checkIn)} &rarr; {formatDate(s.checkOut)} &middot; {s.guests} guest
              {s.guests === 1 ? "" : "s"} &middot; {formatMoney(s.totalPrice)}
            </p>
          </div>
          <StatusBadge
            status={s.status}
            label={hold === "active" ? "Awaiting payment" : hold === "ended" ? "Hold ended" : undefined}
          />
        </div>
        {hold === "active" && (
          <p className="mt-2 text-sm text-accent-deep">
            Your dates are held until{" "}
            {s.holdExpiresAt!.toLocaleTimeString("en-AU", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "Australia/Brisbane",
            })}
            . Pay by card to confirm your booking.
          </p>
        )}
        {hold === "ended" && (
          <p className="mt-2 text-sm text-muted">
            The hold ran out before payment, so the dates were released. You have not been charged.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {hold === "ended" ? (
            <Link
              href={`/listings/${s.listing.slug}/book`}
              className="rounded-md border border-card-border px-3 py-1.5 font-medium hover:border-accent"
            >
              Book again
            </Link>
          ) : (
            <Link
              href={`/manage/${s.manageToken}`}
              className={
                hold === "active"
                  ? "rounded-md bg-accent px-3 py-1.5 font-semibold text-accent-fg hover:bg-accent-hover"
                  : "rounded-md border border-card-border px-3 py-1.5 font-medium hover:border-accent"
              }
            >
              {hold === "active" ? "Pay now" : "Manage booking"}
            </Link>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="rounded-md border border-card-border px-3 py-1.5 font-medium hover:border-accent"
            >
              Call host
            </a>
          )}
          {s.listing.host?.publicEmail && (
            <a
              href={`mailto:${s.listing.host.publicEmail}`}
              className="rounded-md border border-card-border px-3 py-1.5 font-medium hover:border-accent"
            >
              Email host
            </a>
          )}
          <Link
            href={`/listings/${s.listing.slug}#host`}
            className="rounded-md border border-card-border px-3 py-1.5 font-medium hover:border-accent"
          >
            Message host
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My stays</h1>
          <p className="mt-1 text-sm text-muted">
            {guest.name} &middot; {guest.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      {!guest.emailVerifiedAt && (
        <div className="mt-6">
          <VerifyEmailBanner email={guest.email} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        <div className="mt-3 space-y-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted">
              No upcoming stays.{" "}
              <Link href="/gympie" className="text-accent-deep hover:underline">
                Find somewhere to stay
              </Link>
            </p>
          )}
          {upcoming.map((s) => (
            <StayCard key={s.id} s={s} />
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Past and cancelled</h2>
          <div className="mt-3 space-y-3">
            {past.map((s) => (
              <StayCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-sm text-muted">
        Missing a stay? Open the link in your booking email and choose &ldquo;Add this stay to my
        account&rdquo;.
      </p>

      <section className="mt-10 border-t border-card-border pt-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="mt-3 space-y-5">
          <ChangePasswordBox />
          <div>
            <p className="text-sm text-muted">Keep Beeline one tap away on your phone.</p>
            <InstallAppButton className="mt-2" />
          </div>
        </div>
      </section>
    </div>
  );
}
