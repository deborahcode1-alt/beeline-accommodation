import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { getGuest } from "@/lib/guestSession";
import { getAdminContext } from "@/lib/adminAuth";

export async function SiteHeader() {
  const [admin, guest] = await Promise.all([getAdminContext(), getGuest()]);

  const signedIn = admin
    ? { href: "/admin", label: admin.isOwner ? "Admin" : "My dashboard" }
    : guest
      ? { href: "/account", label: "My stays" }
      : null;

  return (
    <header className="bg-header-bg text-header-fg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label="Beeline Accommodation home">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-5 text-sm sm:gap-7">
          <Link href="/#areas" className="hidden text-header-fg/85 transition hover:text-header-fg sm:inline">
            Stays
          </Link>
          <Link href="/#how" className="hidden text-header-fg/85 transition hover:text-header-fg sm:inline">
            How it works
          </Link>
          <Link href="/host" className="text-header-fg/85 transition hover:text-header-fg">
            List your property
          </Link>
          <Link
            href={signedIn ? signedIn.href : "/sign-in"}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            {signedIn ? signedIn.label : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
