import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminContext } from "@/lib/adminAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beeline Host Admin",
  description: "Manage listings, bookings, and calendar sync",
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  const role = !ctx ? "guest" : ctx.isOwner ? "owner" : "host";
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AdminNav role={role} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
