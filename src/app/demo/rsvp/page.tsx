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
    images: [{ url: "/images/demo/luca-victoria-oil-courtyard.webp", width: 1672, height: 941,
      alt: "An oil-style painting of a romantic garden courtyard for Luca and Victoria’s invitation demo." }]
  },
  twitter: { card: "summary_large_image", title: "Luca & Victoria | Invitation demo",
    description: "Try a sample wedding RSVP.", images: ["/images/demo/luca-victoria-oil-courtyard.webp"] }
};

export default function DemoPage() {
  return <RsvpDemo />;
}
