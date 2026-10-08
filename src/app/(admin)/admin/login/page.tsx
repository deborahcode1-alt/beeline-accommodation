import { redirect } from "next/navigation";

// There is one sign-in for everyone now. Old bookmarks and redirects land here and move on.
export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
}
