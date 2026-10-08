import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/guest/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        We will email you a 6-digit code to set a new password. Hosts and owners can change their
        password from the Account tab after signing in.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
