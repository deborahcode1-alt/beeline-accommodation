import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { propertyTypeShort, type PropertyType } from "@/lib/propertyType";
import { bedroomLabel, bathroomLabel, parkingShort } from "@/lib/listingFacts";

type Props = {
  slug: string;
  name: string;
  areaName?: string | null;
  basePrice: number;
  bedrooms: number;
  baths: number;
  parking: string;
  propertyType: PropertyType;
  petFriendly: boolean;
  coverPhoto: string | null;
};

export function ListingCard({
  slug,
  name,
  areaName,
  basePrice,
  bedrooms,
  baths,
  parking,
  propertyType,
  petFriendly,
  coverPhoto,
}: Props) {
  const parkingText = parkingShort(parking);
  const details = [
    bedroomLabel(bedrooms),
    bathroomLabel(baths),
    propertyTypeShort(propertyType),
    ...(petFriendly ? ["Pet friendly"] : []),
    ...(parkingText ? [parkingText] : []),
  ];

  return (
    <Link
      href={`/listings/${slug}`}
      className="group block overflow-hidden rounded-xl border border-card-border bg-background transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-foreground/5">
        {coverPhoto ? (
          <Image
            src={coverPhoto}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No photo yet
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{name}</h3>
        {areaName && <p className="mt-0.5 text-sm text-muted">{areaName}</p>}
        <p className="mt-2 text-sm text-muted">{details.join(" \u00b7 ")}</p>
        <p className="mt-2 text-sm font-semibold">
          {formatMoney(basePrice)} <span className="font-normal text-muted">per night</span>
        </p>
      </div>
    </Link>
  );
}
