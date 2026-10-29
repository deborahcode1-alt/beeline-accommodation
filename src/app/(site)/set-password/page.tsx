import type { Metadata } from "next";
import Link from "next/link";
import { findInvitedLogin } from "@/lib/hostInvite";
import { SetPasswordForm } from "@/components/SetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set your password", robots: { index: false, follow: false } };

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const login = await findInvitedLogin(token);

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-extrabold tracking-tight">Welcome to Beeline</h1>
      {login ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Choose a password for your host account. After this you&apos;ll see your checklist to get your listings
            live.
          </p>
          <SetPasswordForm token={token} email={login.email} />
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-card-border bg-soft p-5 text-sm">
          <p className="font-medium">This link has expired or has already been used.</p>
          <p className="mt-1 text-muted">
            If you already set a password, <Link href="/sign-in" className="text-accent-deep underline">sign in here</Link>.
            Otherwise reply to your approval email and we&apos;ll send you a new link.
          </p>
        </div>
      )}
    </div>
  );
}
