import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["400", "500", "600"],
  style: ["normal", "italic"], display: "swap", variable: "--font-invite-display"
});
const body = Source_Sans_3({
  subsets: ["latin"], display: "swap", variable: "--font-invite-body"
});

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${body.variable}`}>{children}</div>;
}
