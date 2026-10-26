import type { Metadata } from "next";
import { Invitation } from "./invitation";

export const metadata: Metadata = {
  title: "Karsen & Sarah | Your invitation",
  description: "An invitation to celebrate with Karsen and Sarah, July 17, 2027 in Oakville.",
  alternates: { canonical: "/invitation" },
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Karsen & Sarah | Your invitation",
    description: "July 17, 2027 · Oakville, Ontario",
    url: "/invitation",
    images: [{ url: "/images/bronte-harbour-watercolour.webp", width: 1665, height: 968 }]
  },
  twitter: {
    card: "summary_large_image", title: "Karsen & Sarah | Your invitation",
    description: "July 17, 2027 · Oakville, Ontario",
    images: ["/images/bronte-harbour-watercolour.webp"]
  }
};

export default function InvitationPage() {
  return <Invitation />;
}
