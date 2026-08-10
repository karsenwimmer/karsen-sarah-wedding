import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import { SaveDateMark } from "@/components/SaveDateMark";
import { weddingConfig } from "@/config/wedding";
import { createGoogleCalendarUrl, createOutlookCalendarUrl } from "@/lib/calendar";

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
        <SaveDateMark
          className="hero__mark"
          headingId="hero-title"
          sealPriority
          sealSize={160}
          titleElement="h1"
        />
        {weddingConfig.features.countdown ? <Countdown /> : null}
        <div className="hero__details">
          <div className="hero__venue">
            <p>{weddingConfig.venue.reception}</p>
            <p>{weddingConfig.venue.receptionLocation}</p>
          </div>
          <p className="hero__note">Formal invitation to follow. RSVP details will come later.</p>
          <div className="calendar-actions" aria-label="Add this save the date to your calendar">
            <span className="calendar-actions__label">Save the date</span>
            <div className="calendar-actions__links">
              <a href={createGoogleCalendarUrl()} target="_blank" rel="noreferrer">
                Google
              </a>
              <a href={createOutlookCalendarUrl()} target="_blank" rel="noreferrer">
                Outlook
              </a>
              <a href="/save-the-date.ics" download title="Downloads a calendar file for Apple Calendar">
                Apple
              </a>
            </div>
          </div>
          <a className="button button--primary" href="#save-the-date">
            Enter contact details
          </a>
        </div>
      </div>
    </section>
  );
}
