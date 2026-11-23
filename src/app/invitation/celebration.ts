import type { CalendarEvent } from "@/lib/calendar";

export type Venue = {
  id: "church" | "boathouse";
  name: string;
  street: string;
  city: string;
  postalCode: string;
  source: string;
};

// Published venue addresses. Wedding-specific entrances and parking remain to be confirmed.
export const venues: Venue[] = [
  { id: "church", name: "St. Mary’s Parish", street: "23 Sheaffe Street", city: "Hamilton, ON", postalCode: "L8R 2N7", source: "https://stmaryshamilton.com/" },
  { id: "boathouse", name: "The Boathouse", street: "2340 Ontario Street", city: "Oakville, ON", postalCode: "L6L 6P7", source: "https://bronteboathouse.ca/events/" }
];

export type CelebrationEvent = {
  id: string;
  title: string;
  time: string;
  start: string;
  venue: Venue;
  venueLabel: string;
  description: string;
  eveningOnly: boolean;
};

export const celebrationEvents: CelebrationEvent[] = [
  { id: "ceremony", title: "The Ceremony", time: "1:00 PM", start: "2027-07-17T13:00:00-04:00", venue: venues[0], venueLabel: "St. Mary’s Parish, Hamilton, ON", description: "Sharing our vows, surrounded by the people we love.", eveningOnly: false },
  { id: "lunch", title: "Lunch Reception", time: "2:30 PM", start: "2027-07-17T14:30:00-04:00", venue: venues[0], venueLabel: "St. Mary’s Parish (Parish Hall), Hamilton, ON", description: "Join us for a light lunch and a glass of wine before the evening celebrations.", eveningOnly: false },
  { id: "dinner", title: "Dinner Reception", time: "6:00 PM", start: "2027-07-17T18:00:00-04:00", venue: venues[1], venueLabel: "The Boathouse, Oakville, ON", description: "Dinner, toasts, dancing, and most importantly, time with our favourite people.", eveningOnly: true }
];

export function eventsForInvitation(reception: boolean) {
  return celebrationEvents.filter(event => reception || !event.eveningOnly).map(event =>
    !reception && event.id === "lunch"
      ? { ...event, description: "After the ceremony, join us in the parish hall for lunch, a glass of wine, and time to celebrate together." }
      : event
  );
}

export function venueAddress(venue: Venue) { return `${venue.street}, ${venue.city} ${venue.postalCode}`; }
export function mapsUrl(venue: Venue) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venueAddress(venue)}`)}`;
}
export function mapEmbedUrl(venue: Venue) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venue.name}, ${venueAddress(venue)}`)}&z=16&output=embed`;
}

export function eventCalendar(event: CelebrationEvent): CalendarEvent {
  return {
    title: `Karsen & Sarah — ${event.title}`,
    startDate: event.start,
    // Start-only until the couple confirms end times; never imply an invented duration.
    location: `${event.venue.name}${event.id === "lunch" ? " (Parish Hall)" : ""}, ${venueAddress(event.venue)}`,
    description: `${event.description}\nAddresses and parking information: https://thewimmers.ca/invitation#locations`,
    url: "https://thewimmers.ca/invitation",
    uid: `karsen-sarah-20270717-${event.id}@thewimmers.ca`,
    timezone: "America/Toronto"
  };
}
