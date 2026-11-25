import { demoWedding as wedding } from "./demo-data";

export type WeddingEvent = {
  id: string;
  title: string;
  time: string;
  start: string;
  description: string;
  venue: { name: string; address: string };
};

// Toronto is on daylight time on August 28, 2027. End times are not confirmed.
export const weddingEvents: WeddingEvent[] = [
  { id: "ceremony", title: "Wedding ceremony", time: wedding.ceremony.time,
    start: "2027-08-28T16:00:00Z", venue: wedding.ceremony,
    description: "Join us as we exchange our vows at Saints Peter and Paul Parish." },
  { id: "reception", title: "Reception & antipasto bar", time: wedding.reception.time,
    start: "2027-08-28T21:30:00Z", venue: wedding.reception,
    description: "The celebration continues at The Venetian, with an antipasto bar and dinner to follow." }
];

export function directionsTo(venue: { name: string; address: string }) {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination: `${venue.name}, ${venue.address}`, travelmode: "driving" })}`;
}

export const betweenVenues = `https://www.google.com/maps/dir/?${new URLSearchParams({
  api: "1", origin: `${wedding.ceremony.name}, ${wedding.ceremony.address}`,
  destination: `${wedding.reception.name}, ${wedding.reception.address}`, travelmode: "driving"
})}`;

function compact(iso: string) { return iso.replace(/[-:]/g, ""); }
function escapeText(value: string) { return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;"); }
function fold(line: string) {
  const pieces: string[] = [];
  let current = "";
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > 73) { pieces.push(current); current = " " + char; }
    else current += char;
  }
  pieces.push(current);
  return pieces.join("\r\n");
}

export function calendarFile(event: WeddingEvent) {
  // RFC 5545 permits a start-only event. Do not invent a ceremony/reception end.
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Victoria and Luca//Wedding//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:victoria-luca-${event.id}-20270828@thewimmers.ca`, "DTSTAMP:20261124T000000Z",
    `DTSTART:${compact(event.start)}`, `SUMMARY:${escapeText(`Victoria & Luca — ${event.title}`)}`,
    `LOCATION:${escapeText(`${event.venue.name}, ${event.venue.address}`)}`,
    `DESCRIPTION:${escapeText(`${event.description}\nStart time confirmed; full schedule to follow.`)}`,
    "END:VEVENT", "END:VCALENDAR", ""].map(fold).join("\r\n");
}

export function calendarLinks(event: WeddingEvent) {
  const title = `Victoria & Luca — ${event.title}`;
  const location = `${event.venue.name}, ${event.venue.address}`;
  const description = `${event.description}\nStart time confirmed; full schedule to follow.`;
  return {
    google: `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${compact(event.start)}/${compact(event.start)}`, ctz: "America/Toronto", location, details: description })}`,
    outlook: `https://outlook.live.com/calendar/0/action/compose?${new URLSearchParams({ rru: "addevent", subject: title, startdt: event.start, location, body: description })}`,
    file: `/calendars/victoria-luca-${event.id}.ics`
  };
}
