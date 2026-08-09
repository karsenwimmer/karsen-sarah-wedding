import Image from "next/image";
import { weddingConfig } from "@/config/wedding";
import { MailingForm } from "@/components/MailingForm";

const faqs = [
  {
    question: "Is this the formal invitation?",
    answer: "No. A formal invitation with complete details will be mailed at a later date."
  },
  {
    question: "Where will the wedding take place?",
    answer:
      "Our reception will take place at The Boathouse Restaurant & Event Venue in Bronte Harbour, Oakville. Additional ceremony and schedule details will follow."
  },
  {
    question: "Do I need to RSVP now?",
    answer:
      "No. At this stage, we are only collecting mailing and contact information. Formal RSVP instructions will be included with your invitation."
  },
  {
    question: "Can I update my information later?",
    answer:
      "Yes. You may submit the form again using the same primary email address, or contact us if something changes."
  },
  {
    question: "Will more information be added to this website?",
    answer:
      "Yes. We will add the schedule, dress code, venue information, frequently asked questions and other details once they are finalized."
  }
];

export function WreathDivider() {
  return (
    <div className="wreath-divider" aria-hidden="true">
      <Image
        src="/images/decor/gold-wreath-divider.png"
        alt=""
        width={1608}
        height={225}
        sizes="(max-width: 700px) 38vw, 33vw"
      />
    </div>
  );
}

export function MailingPreviewSection() {
  return (
    <section className="section section--mailing" id="save-the-date" aria-labelledby="mailing-title">
      <div className="section__inner section__inner--split">
        <div className="mailing-copy">
          <h2 id="mailing-title">Share Your Household Details</h2>
          <p>
            We will be sending physical invitations with complete wedding details at a later
            date. Please share your household&apos;s mailing and contact information below so we can
            send your invitation and keep you informed as plans are finalized.
          </p>
        </div>
        <div className="mailing-preview" aria-label="Mailing information form">
          <MailingForm />
        </div>
      </div>
    </section>
  );
}

export function UpdatesSection() {
  if (!weddingConfig.features.updates) {
    return null;
  }

  return (
    <section className="section section--quiet" id="updates" aria-labelledby="updates-title">
      <div className="section__inner section__inner--narrow">
        <h2 id="updates-title">Updates</h2>
        <p>More details will be shared here as our celebration approaches.</p>
      </div>
    </section>
  );
}

export function FAQSection() {
  if (!weddingConfig.features.faq) {
    return null;
  }

  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="section__inner">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title">A Few Early Details</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details className="faq" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__rule" />
      <p>Karsen & Sarah</p>
      <p>{weddingConfig.date.label} · Bronte Harbour</p>
    </footer>
  );
}
