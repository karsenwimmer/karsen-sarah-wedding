import type { Metadata } from "next";
import { RsvpDemo } from "./rsvp-demo";

export const metadata: Metadata = {
  title: "Luca & Victoria | Invitation demo",
  description: "Try a sample wedding invitation, RSVP and meal selection.",
  alternates: { canonical: "/demo/rsvp" },
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Luca & Victoria | Invitation demo",
    description: "A sample wedding invitation. Enter a demo code to explore.",
    url: "/demo/rsvp", siteName: "Wedding invitation demo",
    images: [{ url: "/images/demo/luca-victoria-watercolour-portrait-v3.webp", width: 1000, height: 1250,
      alt: "Victoria and Luca in a garden with softly painted watercolour surroundings." }]
  },
  twitter: { card: "summary_large_image", title: "Luca & Victoria | Invitation demo",
    description: "Try a sample wedding RSVP.", images: ["/images/demo/luca-victoria-watercolour-portrait-v3.webp"] }
};

export default function DemoPage() {
  return <RsvpDemo />;
}
