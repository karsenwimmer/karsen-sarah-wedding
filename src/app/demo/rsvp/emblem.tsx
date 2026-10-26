import { useId } from "react";

/** A botanical circle with outlined initials, independent of font loading. */
export function Emblem({ className, compact = false }: { className?: string; compact?: boolean }) {
  const gold = `gold-${useId().replace(/:/g, "")}`;
  return <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
    <defs><linearGradient id={gold} x1="30" y1="20" x2="174" y2="180" gradientUnits="userSpaceOnUse">
      <stop stopColor="#8C682F" /><stop offset=".38" stopColor="#B28E4D" />
      <stop offset=".7" stopColor="#97733A" /><stop offset="1" stopColor="#B28E4D" />
    </linearGradient></defs>
    <g stroke={`url(#${gold})`} strokeWidth={compact ? 2 : 1.15} strokeLinecap="round" strokeLinejoin="round">
      <path d="M177 88C172 51 140 24 102 24C64 24 32 51 25 89M25 116C33 153 64 178 101 178C139 178 171 151 178 113" />
      {!compact && <path d="M180 83C169 47 139 22 104 23M22 121C34 157 65 181 101 180C132 180 160 162 174 138" strokeWidth=".65" />}
      <BotanicalBranch compact={compact} />
      <g transform="rotate(180 100 100)"><BotanicalBranch compact={compact} /></g>
    </g>
    <g fill={`url(#${gold})`} transform="translate(-5 0)">
      <path d="M58 73h17v1.2h-6.2v51.6h9c8 0 11-6 13-15H92l-1 16.2H58v-1.2h6.3V74.2H58Z" />
      <path d="M112 73h20v1.2h-6l15 43 13-36.5c1.5-4-1-6.5-5-6.5V73h17v1.2c-5 0-7 2-9 7L140 128h-1.5l-18-53.8H112Z" transform="translate(8 0) scale(.88 1)" />
    </g>
    <path d="M98 69v62" stroke={`url(#${gold})`} strokeWidth={compact ? 1.6 : .9} />
  </svg>;
}

function BotanicalBranch({ compact }: { compact: boolean }) {
  return <>
    <path d="M103 26C73 29 47 55 33 87C30 94 28 101 27 107" />
    <path d="M85 31C78 28 73 20 75 13C82 16 87 23 85 31ZM77 35C67 36 58 31 54 23C64 23 73 29 77 35ZM68 41C70 49 67 56 61 61C60 52 63 45 68 41ZM60 49C50 50 42 46 37 39C47 37 56 42 60 49ZM48 65C38 68 31 65 25 60C34 56 43 59 48 65ZM43 73C51 71 56 65 57 57C49 59 44 65 43 73Z" />
    {!compact && <>
      <path d="M36 86C28 87 23 93 22 100C29 97 34 92 36 86ZM31 96C35 92 38 85 37 80M32 91C27 89 24 87 23 84M30 100l-6 5M28 105l-1 7" />
      <path d="M78 29l5 1M59 28l15 6M63 56l3-10M42 41l14 6M31 61l12 3M47 69l7-9" strokeWidth=".6" />
    </>}
  </>;
}
