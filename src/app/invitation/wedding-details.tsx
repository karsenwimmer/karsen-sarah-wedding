import { createGoogleCalendarUrl, createIcsCalendarFile, createOutlookCalendarUrl } from "@/lib/calendar";
import { weddingConfig } from "@/config/wedding";
import { eventCalendar, eventsForInvitation, mapEmbedUrl, mapsUrl, venues, type CelebrationEvent } from "./celebration";
import s from "./wedding-details.module.css";

function Chevron() {
  return <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="m1 1 5 5 5-5" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function CalendarMenu({ event }: { event: CelebrationEvent }) {
  const calendar = eventCalendar(event);
  function download() {
    const url = URL.createObjectURL(new Blob([createIcsCalendarFile(calendar)], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `karsen-and-sarah-${event.id}.ics`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details className={s.calendarMenu}>
    <summary aria-label={`Add ${event.title} to your calendar`}>Add to calendar <Chevron /></summary>
    <div className={s.calendarOptions}>
      <a href={createGoogleCalendarUrl(calendar)} target="_blank" rel="noopener noreferrer">Google Calendar</a>
      <a href={createOutlookCalendarUrl(calendar)} target="_blank" rel="noopener noreferrer">Outlook</a>
      <button type="button" onClick={download}>Apple / iCal</button>
    </div>
  </details>;
}

function Pin() {
  return <svg width="24" height="28" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 15-9 15S3 17 3 10a9 9 0 1 1 18 0Z" stroke="currentColor" strokeWidth="1.25"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.25"/></svg>;
}

export function WeddingDetails({ reception, preview }: { reception: boolean; preview: boolean }) {
  const events = eventsForInvitation(reception);
  const visibleVenues = venues.filter(venue => reception || venue.id === "church");
  const faqs = [
    ["Who is included on my invitation?", "Please reply for the people named in your RSVP. If a name looks incorrect, get in touch and we’ll help."],
    ["Can I change my response?", preview ? "Yes. Choose ‘Edit your RSVP’ to update your saved preview reply in this browser. Your choices can be changed up until May 1, 2027." : "Yes. Your choices can be changed up until May 1, 2027. Enter your invitation code on any device, then choose ‘Edit your RSVP’."],
    ["Where should I park?", reception ? "Parking information for each venue will be added to the Locations section before the wedding." : "Parking information for St. Mary’s Parish will be added to the Location section before the wedding."],
    ...(!reception ? [["Where is the lunch reception?", "Lunch is in the parish hall at St. Mary’s, following the ceremony. Both are at 23 Sheaffe Street in Hamilton."]] : []),
    ...(reception ? [["How do I get between venues?", "The ceremony and lunch are at St. Mary’s Parish in Hamilton. The dinner reception is at The Boathouse in Oakville. Directions are linked in Locations; please allow time to travel between them."]] : []),
    ["How do I share dietary requirements?", "Please add allergies or dietary requirements beside each guest’s name in the RSVP form."],
    ...(preview ? [["Is this my official RSVP?", "This is a design preview using fictional households. Your sample reply is saved only in this browser; no real RSVP or confirmation email is sent."]] : [])
  ];
  return <div className={s.details}>
    <section className={s.itinerary} id="the-day" aria-labelledby="itinerary-title">
      <header className={s.sectionHeader}><h2 className={s.sectionTitle} id="itinerary-title">Itinerary</h2><p><time dateTime="2027-07-17">Saturday, July 17, 2027</time></p></header>
      <ol className={s.events}>
        {events.map(event => <li key={event.id} className={s.event}>
          <time className={s.eventTime} dateTime={event.start}>{event.time}</time>
          <div className={s.eventCopy}><h3>{event.title}</h3><p className={s.eventVenue}>{event.venueLabel}</p><p className={s.eventDescription}>{event.description}</p><CalendarMenu event={event} /></div>
        </li>)}
      </ol>
      <a className={s.locationNote} href="#locations">{reception ? "Addresses and parking information below." : "Address and parking information below."}</a>
    </section>

    <section className={s.locations} id="locations" aria-labelledby="locations-title">
      <header className={s.sectionHeader}><h2 className={s.sectionTitle} id="locations-title">{reception ? "Locations" : "Location"}</h2></header>
      <div className={s.venueGrid} data-single={visibleVenues.length === 1 || undefined}>
        {visibleVenues.map(venue => <article className={`${s.venue} ${!reception ? s.singleVenue : ""}`} key={venue.id} aria-labelledby={`${venue.id}-title`}>
          <header className={s.venueHeader}><Pin /><div><h3 id={`${venue.id}-title`}>{venue.name}</h3>{!reception && <p className={s.venueUse}>Ceremony in the church<br />Lunch reception in the parish hall</p>}<address>{venue.street}<br />{venue.city} {venue.postalCode}</address></div></header>
          <div className={s.mapFrame}><iframe title={`Map showing ${venue.name}`} src={mapEmbedUrl(venue)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
          <p className={s.parkingNote}>Parking information to follow.</p>
          <a className={s.outlineButton} href={mapsUrl(venue)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${venue.name} in Google Maps`}>Open in Google Maps</a>
        </article>)}
      </div>
    </section>

    <section className={s.dressCode} id="dress-code" aria-labelledby="dress-title">
      <h2 className={s.sectionTitle} id="dress-title">Dress Code</h2>
      <h3>Elevated Cocktail Attire</h3>
      <p>Think suits with a dress shirt and tie, or elegant cocktail, midi, or long dresses. We’d love to see you dressed up for the occasion.</p>
    </section>

    <section className={s.faq} id="questions" aria-labelledby="faq-title">
      <header><h2 className={s.sectionTitle} id="faq-title">FAQ</h2><a className={s.contact} href={`mailto:${weddingConfig.contact.email}`}>{weddingConfig.contact.email}</a></header>
      <div className={s.faqList}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>
  </div>;
}
