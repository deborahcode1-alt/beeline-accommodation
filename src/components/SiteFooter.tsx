import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SITE_NAME, SITE_SLOGAN } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-header-bg text-header-fg/75">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BrandLogo />
          <p className="mt-3 text-sm">{SITE_SLOGAN}</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <Link href="/host" className="hover:text-header-fg">List your property</Link>
          <Link href="/terms" className="hover:text-header-fg">Terms of use</Link>
          <Link href="/admin/login" className="hover:text-header-fg">Host sign in</Link>
          <Link href="/privacy" className="hover:text-header-fg">Privacy policy</Link>
          <span />
          <Link href="/host-agreement" className="hover:text-header-fg">Host agreement</Link>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        &copy; {new Date().getFullYear()} {SITE_NAME}. Book direct with local hosts.
      </div>
    </footer>
  );
}
