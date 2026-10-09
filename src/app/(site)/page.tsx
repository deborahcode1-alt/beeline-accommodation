import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/visibility";
import { AreaSearch } from "@/components/AreaSearch";
import { SITE_SLOGAN } from "@/lib/site";

export const dynamic = "force-dynamic";

const VALUES = [
  { title: "Local focus", text: "Stays run by people who live here." },
  { title: "Real places", text: "Real photos, honest descriptions." },
  { title: "Direct bookings", text: "Deal with the host, not a middleman." },
  { title: "Welcoming community", text: "Ask questions before you book." },
];

const STEPS = [
  {
    n: "1",
    title: "Pick an area",
    text: "Choose the town or region you are heading to and see the stays hosted there.",
  },
  {
    n: "2",
    title: "Talk to the host",
    text: "Call, text or email the host directly to ask questions and make arrangements.",
  },
  {
    n: "3",
    title: "Book direct",
    text: "Book fast where the host allows instant booking, or send a request. No commission.",
  },
];

export default async function HomePage() {
  const areas = await prisma.area.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: { where: publicListingWhere() } } } },
  });

  return (
    <div>
      <section className="bg-soft">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-deep">
            {SITE_SLOGAN}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Find your next stay in regional Australia.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-foreground/80">
            Unique places. Local stays. Direct bookings.
          </p>
          <p className="mt-5 max-w-xl rounded-lg border border-accent bg-background px-4 py-3 text-sm">
            <strong>This site is growing, and so are our stays.</strong> We are adding new places
            and new areas all the time, so check back soon.
          </p>
        </div>
      </section>

      <section id="areas" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-bold">Where we are</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Link
              key={a.id}
              href={`/${a.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-header-bg"
            >
              {a.heroImage && (
                <Image
                  src={a.heroImage}
                  alt={`${a.name} accommodation`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-2xl font-bold">{a.name} Accommodation</h3>
                <p className="text-sm text-white/85">
                  {a._count.listings} stay{a._count.listings === 1 ? "" : "s"} &middot; {a.state}
                </p>
              </div>
            </Link>
          ))}
          <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-card-border p-6 text-center text-sm text-muted">
            <span>
              More areas coming soon. Want yours listed?{" "}
              <Link href="/host" className="text-accent-deep underline">
                Become a collaborator
              </Link>
              .
            </span>
          </div>
        </div>
      </section>

      <section className="border-y border-card-border bg-soft">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title}>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-bold">How Beeline works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-fg">
                {s.n}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="search" className="border-t border-card-border bg-soft">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold">Where are you going?</h2>
          <p className="mt-1 text-sm text-muted">Type a town or area to see the stays there.</p>
          <div className="mt-5">
            <AreaSearch areas={areas.map((a) => ({ slug: a.slug, name: a.name, state: a.state }))} />
          </div>
        </div>
      </section>

      <section className="bg-header-bg text-header-fg">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Host accommodation in your area?</h2>
            <p className="mt-2 max-w-xl text-header-fg/80">
              Become a Beeline collaborator and list your property for a simple subscription. No
              commission, your own payment method, and guests contact you directly.
            </p>
          </div>
          <Link
            href="/host"
            className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            Become a collaborator
          </Link>
        </div>
      </section>
    </div>
  );
}
