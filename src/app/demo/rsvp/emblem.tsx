import { useId } from "react";

/** Outlined letterforms keep the crest consistent without depending on font loading. */
export function Emblem({ className, compact = false }: { className?: string; compact?: boolean }) {
  const gold = `gold-${useId().replace(/:/g, "")}`;
  return <svg className={className} viewBox="0 0 160 190" fill="none" aria-hidden="true">
    <defs><linearGradient id={gold} x1="24" y1="18" x2="136" y2="174" gradientUnits="userSpaceOnUse">
      <stop stopColor="#89632E" /><stop offset=".38" stopColor="#B08A48" />
      <stop offset=".7" stopColor="#987039" /><stop offset="1" stopColor="#B08A48" />
    </linearGradient></defs>
    <g stroke={`url(#${gold})`}>
      <ellipse cx="80" cy="95" rx="60" ry="77" strokeWidth={compact ? 2.7 : 1.8} />
      {!compact && <ellipse cx="80" cy="95" rx="54.5" ry="71.5" strokeWidth=".65" />}
      {!compact && <path d="M80 12v12m-4-6h8M80 166v12m-4-6h8" strokeWidth="1.3" />}
    </g>
    <g fill={`url(#${gold})`}>
      <path d="M35 67h26v2H54v51h9c9 0 13-7 15-17h2l-2 19H35v-2h7V69h-7Z" />
      <path d="M88 67h25v2h-6l15 40 13-35c1-3 0-5-6-5v-2h18v2c-5 0-7 2-9 7l-18 47h-3L96 69h-8Z" transform="translate(14 0) scale(.8 1)" />
      <path d="M84 91c-2-2-4-5-4-8 0-5 3-8 8-8 4 0 7 3 7 6 0 4-3 7-7 10l9 11c2-3 3-6 3-10h-4v-2h11v2h-4c-1 5-2 8-5 12l4 4h5v2h-10l-3-4c-3 3-6 5-10 5-7 0-12-4-12-10 0-5 4-8 12-10Zm2-3c4-3 6-5 6-8 0-2-1-4-4-4-2 0-4 2-4 5 0 2 1 4 2 7Zm-1 5c-5 3-7 5-7 9 0 4 3 7 7 7 3 0 5-1 8-4Z" transform="translate(25 29) scale(.65)" />
    </g>
  </svg>;
}
