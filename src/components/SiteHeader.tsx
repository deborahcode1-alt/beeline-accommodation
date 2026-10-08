import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteHeader() {
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
            href="/admin/login"
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
