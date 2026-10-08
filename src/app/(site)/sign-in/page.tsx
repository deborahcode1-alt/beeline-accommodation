import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuest, safeNext } from "@/lib/guestSession";
import { getAdminContext } from "@/lib/adminAuth";
import { SignInForm } from "@/components/guest/SignInForm";
import { InstallAppButton } from "@/components/InstallAppButton";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getAdminContext()) redirect("/admin");
  if (await getGuest()) redirect(safeNext(next, ["/account", "/manage", "/listings"]) ?? "/account");

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Guests see their stays here. Hosts and owners are taken to their dashboard.
      </p>
      <div className="mt-6">
        <SignInForm next={next} />
      </div>
      <div className="mt-10 border-t border-card-border pt-6 text-sm text-muted">
        <p>Keep Beeline one tap away on your phone.</p>
        <InstallAppButton className="mt-3" />
      </div>
    </div>
  );
}
