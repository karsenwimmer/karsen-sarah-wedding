import { EnvelopeIntro } from "@/components/EnvelopeIntro";
import { Hero } from "@/components/Hero";
import {
  FAQSection,
  MailingPreviewSection,
  SiteFooter,
  UpdatesSection,
  WreathDivider
} from "@/components/Sections";
import { SiteHeader } from "@/components/SiteHeader";
import { weddingConfig } from "@/config/wedding";

export default function Home() {
  return (
    <>
      {weddingConfig.features.envelopeIntro ? <EnvelopeIntro /> : null}
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <WreathDivider />
        <MailingPreviewSection />
        <UpdatesSection />
        <FAQSection />
      </main>
      <SiteFooter />
    </>
  );
}
