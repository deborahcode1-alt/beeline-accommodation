"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

type Role = "owner" | "host" | "guest";

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  const links =
    role === "owner"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/bookings", label: "Bookings" },
          { href: "/admin/listings", label: "Listings" },
          { href: "/admin/hosts", label: "Hosts" },
          { href: "/admin/areas", label: "Areas" },
          { href: "/admin/account", label: "Account" },
        ]
      : role === "host"
        ? [
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/bookings", label: "Bookings" },
            { href: "/admin/listings", label: "Listings" },
            { href: "/admin/profile", label: "Profile" },
            { href: "/admin/subscription", label: "Subscription" },
            { href: "/admin/account", label: "Account" },
          ]
        : [];

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="bg-header-bg text-header-fg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <Link href="/admin" aria-label="Beeline host admin">
            <BrandLogo />
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm">
            {links.map((link) => {
              const active =
                link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "font-semibold text-accent"
                      : "text-header-fg/70 transition hover:text-header-fg"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {role !== "guest" && (
          <button
            onClick={logout}
            className="text-sm text-header-fg/70 transition hover:text-header-fg"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  );
}
