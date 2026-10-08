import Link from "next/link";

type CalBooking = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  listingName: string;
  status: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// Bookings are stored as UTC-midnight calendar dates, so the grid works in UTC too.
export function MonthCalendar({
  year,
  month,
  bookings,
}: {
  year: number;
  month: number; // 0-11
  bookings: CalBooking[];
}) {
  const first = Date.UTC(year, month, 1);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (new Date(first).getUTCDay() + 6) % 7; // Monday first
  const cells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const prev = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));
  const title = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/admin?month=${monthParam(prev.getUTCFullYear(), prev.getUTCMonth())}#calendar`}
            className="rounded-md border border-card-border px-3 py-1 hover:border-accent"
          >
            &larr; Prev
          </Link>
          <Link
            href="/admin#calendar"
            className="rounded-md border border-card-border px-3 py-1 hover:border-accent"
          >
            Today
          </Link>
          <Link
            href={`/admin?month=${monthParam(next.getUTCFullYear(), next.getUTCMonth())}#calendar`}
            className="rounded-md border border-card-border px-3 py-1 hover:border-accent"
          >
            Next &rarr;
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-card-border bg-card-border text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-soft px-2 py-1.5 font-semibold text-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: cells }, (_, i) => {
          const dayNum = i - leading + 1;
          const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dayMs = Date.UTC(year, month, dayNum);
          const todayMs = (() => {
            const n = new Date();
            return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
          })();
          const stays = inMonth
            ? bookings.filter(
                (b) => b.checkIn.getTime() <= dayMs && dayMs < b.checkOut.getTime()
              )
            : [];
          return (
            <div
              key={i}
              className={`min-h-20 bg-background p-1.5 ${inMonth ? "" : "opacity-40"} ${
                dayMs === todayMs ? "ring-2 ring-inset ring-accent" : ""
              }`}
            >
              {inMonth && <div className="font-medium text-muted">{dayNum}</div>}
              <div className="mt-1 space-y-1">
                {stays.slice(0, 3).map((b) => {
                  const arriving = b.checkIn.getTime() === dayMs;
                  return (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      title={`${b.guestName} — ${b.listingName}${arriving ? " (arrives)" : ""}`}
                      className={`block truncate rounded px-1.5 py-0.5 ${
                        b.status === "CONFIRMED"
                          ? "bg-accent text-accent-fg"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {arriving ? "→ " : ""}
                      {b.guestName.split(" ")[0]} &middot; {b.listingName}
                    </Link>
                  );
                })}
                {stays.length > 3 && <div className="text-muted">+{stays.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        Yellow = confirmed, pale = waiting for your response. An arrow marks arrival day.
      </p>
    </div>
  );
}

export function parseMonth(value: string | undefined) {
  const now = new Date();
  const m = value?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month >= 0 && month <= 11) return { year, month };
  }
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

