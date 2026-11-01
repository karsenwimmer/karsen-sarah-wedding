import { useId } from "react";
import s from "./invitation.module.css";

/** An engraved brass keepsake, drawn as a vector so its fine details stay crisp. */
export function OrnateLock() {
  const id = useId();
  const brass = `url(#${id}-brass)`;
  const edge = `url(#${id}-edge)`;
  const face = `url(#${id}-face)`;
  return <svg className={s.ceremonialLock} viewBox="0 0 240 300" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-brass`} x1="55" y1="40" x2="185" y2="235" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8d6228" /><stop offset=".2" stopColor="#e9cf8d" /><stop offset=".42" stopColor="#b38a43" /><stop offset=".63" stopColor="#f1dca5" /><stop offset="1" stopColor="#916a30" />
      </linearGradient>
      <linearGradient id={`${id}-edge`} x1="55" y1="125" x2="185" y2="265" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f8e5b3" /><stop offset=".38" stopColor="#ad823d" /><stop offset=".7" stopColor="#e3c17b" /><stop offset="1" stopColor="#795422" />
      </linearGradient>
      <linearGradient id={`${id}-face`} x1="76" y1="130" x2="170" y2="260" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f4e6be" /><stop offset=".5" stopColor="#d8bb7b" /><stop offset="1" stopColor="#c19b57" />
      </linearGradient>
    </defs>
    <g className={s.ornateShackle}>
      <path d="M74 133V83a46 46 0 0 1 92 0v50" stroke="#795625" strokeWidth="15" strokeLinecap="round" />
      <path d="M74 133V83a46 46 0 0 1 92 0v50" stroke={brass} strokeWidth="12" strokeLinecap="round" />
      <path d="M71 119V83a49 49 0 0 1 98 0v36" stroke="#fff0c8" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <path d="M78 122V84a42 42 0 0 1 84 0v38" stroke="#9e7636" strokeWidth="1" opacity=".75" />
      <path d="M72 111h5m86 0h5M72 115h5m86 0h5" stroke="#87602a" strokeWidth="1" />
    </g>
    <path d="M68 122h104c12 0 21 10 21 22v88c0 18-15 31-33 34l-40 9-40-9c-18-3-33-16-33-34v-88c0-12 9-22 21-22Z" fill={edge} stroke="#8e692f" strokeWidth="1.2" />
    <path d="M69 129h102c8 0 15 7 15 16v86c0 14-12 25-28 28l-38 8-38-8c-16-3-28-14-28-28v-86c0-9 7-16 15-16Z" fill={face} stroke="#f7e8bf" strokeWidth="1.2" />
    <path d="M73 136h94c7 0 12 5 12 12v81c0 11-9 20-23 23l-36 8-36-8c-14-3-23-12-23-23v-81c0-7 5-12 12-12Z" stroke="#9d783a" strokeWidth=".8" />
    <path d="M76 140h88c6 0 11 4 11 10v77c0 10-9 18-21 21l-34 7-34-7c-12-3-21-11-21-21v-77c0-6 5-10 11-10Z" stroke="#f7e6b6" strokeWidth=".7" opacity=".8" />
    <g stroke="#9a7335" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M77 163c-12-15 3-22 10-16 5 5-1 11-5 7-3-3 1-7 4-4m-9 13c7-4 14-2 14 4 0 5-6 5-7 2m-7-6c-7 3-8 12-4 17m4-17c0-7-5-10-8-10" />
      <path d="M163 163c12-15-3-22-10-16-5 5 1 11 5 7 3-3-1-7-4-4m9 13c-7-4-14-2-14 4 0 5 6 5 7 2m7-6c7 3 8 12 4 17m-4-17c0-7 5-10 8-10" />
      <path d="M77 222c-10 13 1 23 10 17 5-4 1-10-3-7-3 2 0 6 3 4m-10-14c7 2 15 1 18-4m-18 4c-6-3-7-9-5-14m5 14c0 7-5 10-8 10" />
      <path d="M163 222c10 13-1 23-10 17-5-4-1-10 3-7 3 2 0 6-3 4m10-14c-7 2-15 1-18-4m18 4c6-3 7-9 5-14m-5 14c0 7 5 10 8 10" />
      <path d="M97 148c7-7 15-7 23-3 8-4 16-4 23 3m-34-1 11 5 11-5M96 241c8-3 16-1 24 4 8-5 16-7 24-4m-33 3 9 6 9-6" />
    </g>
    <g fill="#a68040" opacity=".8">
      <path d="M81 178c-9 3-9 10-7 15 6-2 9-7 7-15Zm-3 17c-8 5-6 12-3 16 5-4 6-9 3-16Zm7 12c-1-8 4-12 9-13 1 6-2 11-9 13Z" />
      <path d="M159 178c9 3 9 10 7 15-6-2-9-7-7-15Zm3 17c8 5 6 12 3 16-5-4-6-9-3-16Zm-7 12c1-8-4-12-9-13-1 6 2 11 9 13Z" />
    </g>
    <ellipse cx="120" cy="183" rx="28" ry="30" fill="#eddaa5" stroke="#af8848" strokeWidth="1" />
    <ellipse cx="120" cy="183" rx="24" ry="26" stroke="#fff0c6" strokeWidth=".8" />
    <text x="120" y="184" textAnchor="middle" className={s.lockMonogram} fill="#87612c">K<tspan fontSize="10" dy="-2"> &amp; </tspan><tspan dy="2">S</tspan></text>
    <path d="m115 194 5 3 5-3m-5 3v4" stroke="#ad8747" strokeWidth=".8" strokeLinecap="round" />
    <path d="M120 211c-10 0-16 7-16 15 0 7 7 12 16 14 9-2 16-7 16-14 0-8-6-15-16-15Z" fill={brass} stroke="#9c7232" strokeWidth=".8" />
    <path d="M124 223a4.5 4.5 0 1 0-8 0l-1.5 9h11Z" fill="#644820" stroke="#f0d79e" strokeWidth=".7" />
    <g fill="#9d7638" stroke="#f5e2af" strokeWidth=".6">
      <circle cx="62" cy="144" r="2" /><circle cx="178" cy="144" r="2" /><circle cx="65" cy="239" r="2" /><circle cx="175" cy="239" r="2" />
      <path d="m120 131 2 3-2 3-2-3Zm0 127 2 3-2 3-2-3Z" />
    </g>
  </svg>;
}
