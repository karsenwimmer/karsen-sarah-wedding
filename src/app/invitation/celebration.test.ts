import { describe, expect, it } from "vitest";
import { createIcsCalendarFile } from "@/lib/calendar";
import { eventCalendar, eventsForInvitation, mapsUrl, venues } from "./celebration";

describe("invitation schedule", () => {
  it("includes all three start times for reception guests with separate calendar identities", () => {
    const events = eventsForInvitation(true);
    expect(events.map(event => event.time)).toEqual(["1:00 PM", "2:30 PM", "6:00 PM"]);
    const entries = events.map(eventCalendar);
    expect(new Set(entries.map(event => event.uid)).size).toBe(3);
    expect(entries.map(event => createIcsCalendarFile(event).match(/DTSTART:(.+)/)?.[1].trim())).toEqual(["20270717T170000Z", "20270717T183000Z", "20270717T220000Z"]);
    expect(entries[1].location).toContain("Parish Hall");
    expect(entries[2].location).toContain("2340 Ontario Street");
  });
  it("includes church lunch for everyone while keeping dinner invitation-specific", () => {
    const events = eventsForInvitation(false);
    expect(events.map(event => event.id)).toEqual(["ceremony", "lunch"]);
    const lunch = eventCalendar(events[1]);
    expect(lunch.description).toContain("join us in the parish hall for lunch");
    expect(lunch.description).not.toMatch(/evening|dinner|Boathouse|Oakville/i);
    expect(eventsForInvitation(true)[1].description).toContain("before the evening celebrations");
  });
  it("links directions to each full venue address", () => {
    for (const venue of venues) {
      const query = new URL(mapsUrl(venue)).searchParams.get("query");
      expect(query).toContain(venue.street);
      expect(query).toContain(venue.postalCode);
    }
  });
});
