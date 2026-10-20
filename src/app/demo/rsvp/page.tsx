import type { Metadata } from "next";
import { RsvpDemo } from "./rsvp-demo";

export const metadata: Metadata = {
  title: "Alex & Jamie | Invitation demo",
  description: "Try a sample wedding invitation, RSVP and meal selection.",
  alternates: { canonical: "/demo/rsvp" },
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Alex & Jamie | Invitation demo",
    description: "A sample wedding invitation. Enter a demo code to explore.",
    url: "/demo/rsvp", siteName: "Wedding invitation demo", images: []
  },
  twitter: { card: "summary", title: "Wedding invitation demo", description: "Try a sample wedding RSVP.", images: [] }
};

export default function DemoPage() {
  return <RsvpDemo />;
}
