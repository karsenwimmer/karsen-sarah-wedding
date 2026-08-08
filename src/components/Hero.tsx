import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import { SealMark } from "@/components/SealMark";
import { weddingConfig } from "@/config/wedding";

export function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <Image
        className="hero__image"
        src="/images/bronte-harbour-watercolour.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="hero__wash" aria-hidden="true" />
      <div className="hero__content">
        <SealMark className="hero__seal" priority size={160} />
        <p className="eyebrow">Save the Date</p>
        <h1 id="hero-title">{weddingConfig.couple.displayName}</h1>
        <p className="hero__date">{weddingConfig.date.shortLabel}</p>
        {weddingConfig.features.countdown ? <Countdown /> : null}
        <div className="hero__venue">
          <p>{weddingConfig.venue.reception}</p>
          <p>{weddingConfig.venue.receptionLocation}</p>
        </div>
        <p className="hero__note">Formal invitation to follow. RSVP details will come later.</p>
        <a className="button button--primary" href="#save-the-date">
          Save the Date
        </a>
      </div>
    </section>
  );
}
