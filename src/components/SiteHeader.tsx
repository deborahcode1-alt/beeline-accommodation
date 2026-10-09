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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
        <Link href="/" aria-label="Beeline Accommodation home">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-6">
          <Link href="/#areas" className="hidden text-header-fg/85 transition hover:text-header-fg md:inline">
            Stays
          </Link>
          <Link href="/#how" className="hidden text-header-fg/85 transition hover:text-header-fg md:inline">
            How it works
          </Link>
          {/* The yellow button is the invitation to join; sign in is quieter. */}
          <Link
            href="/host"
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            Become a collaborator
          </Link>
          <Link
            href={signedIn ? signedIn.href : "/sign-in"}
            className="rounded-md border border-header-fg/40 px-4 py-1.5 text-sm font-semibold text-header-fg transition hover:border-header-fg hover:bg-header-fg/10"
          >
            {signedIn ? signedIn.label : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
