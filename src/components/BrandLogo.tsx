// Beeline mark: a honeycomb hexagon with a house window inside, on a honey tile.
// Drawn as SVG so it stays sharp at any size.

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Beeline logo">
      <rect width="100" height="100" rx="22" fill="#FFC107" />
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M50 20 L77 35 L77 66 L50 81 L23 66 L23 35 Z" fill="#FFC107" stroke="#111" strokeWidth="7" />
        <path d="M23 52 L50 67 L77 52 L77 66 L50 81 L23 66 Z" fill="#F59E0B" stroke="#111" strokeWidth="5" />
        <rect x="62" y="16" width="8" height="13" fill="#111" stroke="none" />
      </g>
      <g fill="#111">
        <rect x="42" y="36" width="7" height="7" rx="1.2" />
        <rect x="51" y="36" width="7" height="7" rx="1.2" />
        <rect x="42" y="45" width="7" height="7" rx="1.2" />
        <rect x="51" y="45" width="7" height="7" rx="1.2" />
      </g>
    </svg>
  );
}

export function BrandLogo({ light = true }: { light?: boolean }) {
  // light = for dark backgrounds (white text)
  const text = light ? "text-white" : "text-[#111111]";
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark />
      <span className={`flex flex-col leading-none ${text}`}>
        <span className="text-xl font-extrabold tracking-tight">Beeline</span>
        <span className="mt-1 text-[8px] font-medium tracking-[0.38em]">ACCOMMODATION</span>
      </span>
    </span>
  );
}
