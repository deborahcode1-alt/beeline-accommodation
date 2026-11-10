import Link from "next/link";
import type { ReactNode } from "react";

// The look of the owner and host dashboards: rounded cards, icon badges, soft honey gradients and a gentle
// wave on the number tiles. It uses only the Beeline brand colours (honey yellow, black, white and the pale
// honey tint), so it reads as Beeline.

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-5h4v5" />
  </Icon>
);
export const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);
export const BellIcon = () => (
  <Icon>
    <path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5L6 16z" />
    <path d="M10 20a2 2 0 004 0" />
  </Icon>
);
export const CalendarIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);
export const CalendarCheckIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4" />
  </Icon>
);
export const MailIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7.5L12 13l8.5-5.5" />
  </Icon>
);
export const BedIcon = () => (
  <Icon>
    <path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 00-3-3h-8v6" />
    <circle cx="6.5" cy="11.5" r="1.6" />
  </Icon>
);
export const CheckIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.7 2.7L16 9.5" />
  </Icon>
);
export const ListIcon = () => (
  <Icon>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </Icon>
);

/** A rounded square icon: black with a honey icon, echoing the Beeline logo. */
export function IconBadge({
  children,
  tone = "dark",
  className = "h-10 w-10",
}: {
  children: ReactNode;
  tone?: "dark" | "honey";
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl shadow-sm ${className} ${
        tone === "dark" ? "bg-header-bg text-accent" : "bg-accent text-accent-fg"
      }`}
    >
      {children}
    </span>
  );
}

/** A full-width bar with an icon, a message and an action. Honey-lit when something needs attention. */
export function NoticeBar({
  icon,
  tone = "calm",
  href,
  action,
  children,
}: {
  icon: ReactNode;
  tone?: "calm" | "alert";
  href?: string;
  /** Short label for the button on the right, e.g. "Review and approve". */
  action?: string;
  children: ReactNode;
}) {
  const shell = `mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
    tone === "alert"
      ? "border-accent/70 bg-gradient-to-r from-accent/30 via-accent/10 to-white shadow-[0_10px_28px_-16px_rgba(245,158,11,0.8)]"
      : "border-card-border bg-gradient-to-r from-soft to-white"
  } ${href ? "hover:-translate-y-px hover:shadow-md" : ""}`;
  const inner = (
    <>
      <IconBadge className="h-9 w-9">{icon}</IconBadge>
      <span className="min-w-[12rem] flex-1">{children}</span>
      {action && (
        <span
          className={`ml-auto shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            tone === "alert" ? "bg-header-bg text-header-fg" : "border border-card-border bg-white text-foreground"
          }`}
        >
          {action} &rarr;
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={shell}>
      {inner}
    </Link>
  ) : (
    <div className={shell}>{inner}</div>
  );
}

const WAVE = "M0 42 C 30 8, 60 56, 100 30 S 170 6, 200 28";

const tiles = {
  honey: {
    box: "bg-gradient-to-br from-accent to-accent-hover text-accent-fg border-accent",
    label: "text-accent-fg/80",
    wave: "text-accent-fg",
    fill: 0.12,
    badge: "dark" as const,
  },
  dark: {
    box: "bg-gradient-to-br from-[#262626] to-header-bg text-white border-header-bg",
    label: "text-white/70",
    wave: "text-accent",
    fill: 0.08,
    badge: "honey" as const,
  },
  cream: {
    box: "bg-gradient-to-br from-soft to-white text-foreground border-card-border",
    label: "text-muted",
    wave: "text-accent-hover",
    fill: 0.16,
    badge: "dark" as const,
  },
};

/** A big-number tile with an icon and a soft wave along the bottom. */
export function StatTile({
  label,
  value,
  icon,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone: keyof typeof tiles;
  href?: string;
}) {
  const t = tiles[tone];
  const body = (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition ${t.box} ${
        href ? "hover:-translate-y-0.5 hover:shadow-lg" : ""
      }`}
    >
      <svg
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full ${t.wave}`}
        aria-hidden
      >
        <path d={`${WAVE} V60 H0 Z`} fill="currentColor" opacity={t.fill} />
        <path d={WAVE} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      </svg>
      <div className="relative flex items-start justify-between gap-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${t.label}`}>{label}</p>
        <IconBadge tone={t.badge} className="h-9 w-9">
          {icon}
        </IconBadge>
      </div>
      <p className="relative mt-2 pb-6 text-4xl font-bold leading-none">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** A small cluster of honeycomb cells, as a quiet decoration. */
function Honeycomb({ className = "" }: { className?: string }) {
  const cell = (cx: number, cy: number, fill: string, opacity: number) => {
    const r = 22;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
    return <polygon key={`${cx}-${cy}`} points={pts} fill={fill} opacity={opacity} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />;
  };
  return (
    <svg viewBox="0 0 150 100" className={className} aria-hidden>
      {cell(46, 34, "#FFC107", 0.9)}
      {cell(84, 56, "#F59E0B", 0.75)}
      {cell(46, 78, "#FFF8E1", 1)}
      {cell(122, 34, "#FFF8E1", 1)}
    </svg>
  );
}

/** A white rounded card with an icon, a title and an optional line under it. */
export function SectionCard({
  id,
  icon,
  title,
  subtitle,
  decorated = false,
  children,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  decorated?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative mt-8 scroll-mt-4 overflow-hidden rounded-2xl border border-card-border bg-white p-5 shadow-sm">
      {decorated && <Honeycomb className="pointer-events-none absolute -top-2 right-3 hidden h-24 w-36 opacity-90 sm:block" />}
      <div className="relative flex items-center gap-3">
        <IconBadge>{icon}</IconBadge>
        <div>
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="relative mt-4">{children}</div>
    </section>
  );
}
