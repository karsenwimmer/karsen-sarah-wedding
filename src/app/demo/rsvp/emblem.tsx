import { useId } from "react";

export function Emblem({ className }: { className?: string }) {
  const gold = `gold-${useId().replace(/:/g, "")}`;
  return <svg className={className} viewBox="0 0 160 190" fill="none" aria-hidden="true">
    <defs><linearGradient id={gold} x1="16" y1="10" x2="142" y2="182" gradientUnits="userSpaceOnUse">
      <stop stopColor="#8D6836" /><stop offset=".3" stopColor="#BE9A58" />
      <stop offset=".56" stopColor="#A77D3D" /><stop offset=".78" stopColor="#C3A367" /><stop offset="1" stopColor="#8D6836" />
    </linearGradient></defs>
    <g stroke={`url(#${gold})`}>
      <ellipse cx="80" cy="95" rx="57" ry="78" strokeWidth="1.8" />
      <ellipse cx="80" cy="95" rx="51" ry="72" strokeWidth=".7" />
      <path d="M80 10L83 17L80 24L77 17Z M80 166L83 173L80 180L77 173Z" fill={`url(#${gold})`} strokeWidth=".5" />
    </g>
    <g fill={`url(#${gold})`} fontFamily="var(--font-invite-display), Didot, serif" fontWeight="400">
      <text x="48" y="114" textAnchor="middle" fontSize="52">L</text>
      <text x="109" y="114" textAnchor="middle" fontSize="52">V</text>
      <text x="78" y="107" textAnchor="middle" fontSize="18" fontStyle="italic">&</text>
    </g>
  </svg>;
}
