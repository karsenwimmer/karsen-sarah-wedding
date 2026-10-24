import { useId } from "react";

export function Emblem({ className }: { className?: string }) {
  const gold = `gold-${useId().replace(/:/g, "")}`;
  return <svg className={className} viewBox="0 0 160 190" fill="none" aria-hidden="true">
    <defs><linearGradient id={gold} x1="16" y1="10" x2="142" y2="182" gradientUnits="userSpaceOnUse">
      <stop stopColor="#8D6836" /><stop offset=".29" stopColor="#D3B16D" />
      <stop offset=".5" stopColor="#AD8443" /><stop offset=".73" stopColor="#D7BE86" /><stop offset="1" stopColor="#8F6A35" />
    </linearGradient></defs>
    <g stroke={`url(#${gold})`}>
      <path d="M80 10C47 10 21 42 21 88C21 134 47 169 80 180C113 169 139 134 139 88C139 42 113 10 80 10Z" strokeWidth="1.4" />
      <path d="M80 17C51 17 28 47 28 88C28 130 51 161 80 173C109 161 132 130 132 88C132 47 109 17 80 17Z" strokeWidth=".6" />
      <path d="M80 1L84 8L80 15L76 8Z" fill={`url(#${gold})`} strokeWidth=".5" />
      <path d="M80 175L84 182L80 189L76 182Z" fill={`url(#${gold})`} strokeWidth=".5" />
      <path d="M49 149C40 139 35 123 35 107M111 149C120 139 125 123 125 107" strokeWidth=".8" />
      <path d="M39 128C29 125 29 119 30 114C37 117 40 121 39 128ZM44 140C34 139 32 134 32 129C40 130 44 133 44 140ZM121 128C131 125 131 119 130 114C123 117 120 121 121 128ZM116 140C126 139 128 134 128 129C120 130 116 133 116 140Z" fill={`url(#${gold})`} strokeWidth=".3" />
      <path d="M61 148H99M68 154H92M80 32V39M76.5 35.5H83.5" strokeWidth=".7" />
    </g>
    <g fill={`url(#${gold})`} fontFamily="var(--font-invite-display), Didot, serif" fontWeight="400">
      <text x="42" y="101" fontSize="61">L</text><text x="77" y="123" fontSize="64">V</text>
      <text x="72" y="87" fontSize="23" fontStyle="italic">&</text>
    </g>
  </svg>;
}
