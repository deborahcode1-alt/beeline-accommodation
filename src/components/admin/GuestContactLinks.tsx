// One-tap ways to reach a guest: phone, text and email open the device's own apps.

const link = "rounded-md border border-card-border px-2.5 py-1 text-xs font-medium hover:border-accent";

export function GuestContactLinks({
  phone,
  email,
}: {
  phone: string | null;
  email: string;
}) {
  const clean = phone?.replace(/[^\d+]/g, "");
  return (
    <div className="flex flex-wrap gap-1.5">
      {clean && (
        <a href={`tel:${clean}`} className={link}>
          Call
        </a>
      )}
      {clean && (
        <a href={`sms:${clean}`} className={link}>
          Text
        </a>
      )}
      <a href={`mailto:${email}`} className={link}>
        Email
      </a>
    </div>
  );
}
