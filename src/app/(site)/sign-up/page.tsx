import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuest, safeNext } from "@/lib/guestSession";
import { getAdminContext } from "@/lib/adminAuth";
import { SignUpForm } from "@/components/guest/SignUpForm";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getAdminContext()) redirect("/admin");
  if (await getGuest()) redirect(safeNext(next, ["/account", "/manage", "/listings"]) ?? "/account");

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Keep all your stays in one place and rebook your favourite hosts faster. Hosts do not
        need a guest account; ask us about listing your property instead.
      </p>
      <div className="mt-6">
        <SignUpForm next={next} />
      </div>
    </div>
  );
}
