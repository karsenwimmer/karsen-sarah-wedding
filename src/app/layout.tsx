import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Libre_Franklin } from "next/font/google";
import "./globals.css";
import { weddingConfig } from "@/config/wedding";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display"
});

const body = Libre_Franklin({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

const siteUrl = weddingConfig.links.websiteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: weddingConfig.social.title,
  description: weddingConfig.social.description,
  alternates: {
    canonical: siteUrl
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false
    }
  },
  openGraph: {
    title: weddingConfig.social.title,
    description: weddingConfig.social.description,
    url: siteUrl,
    siteName: weddingConfig.couple.displayName,
    images: [
      {
        url: weddingConfig.social.image,
        width: 1665,
        height: 968,
        alt: "Watercolor view of Bronte Harbour for Karsen and Sarah's wedding."
      }
    ],
    locale: "en_CA",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: weddingConfig.social.title,
    description: weddingConfig.social.description,
    images: [weddingConfig.social.image]
  }
};

export const viewport: Viewport = {
  themeColor: "#F7F4EC",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
