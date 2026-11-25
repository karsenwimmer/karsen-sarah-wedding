import { describe, expect, it } from "vitest";
import { betweenVenues, calendarFile, calendarLinks, directionsTo, weddingEvents } from "./event-tools";

describe("Victoria and Luca guest planning tools", () => {
  it("keeps calendar starts at noon and 5:30 PM in Toronto without inventing end times", () => {
    expect(weddingEvents.map(event => event.start)).toEqual(["2027-08-28T16:00:00Z", "2027-08-28T21:30:00Z"]);
    for (const event of weddingEvents) {
      const file = calendarFile(event);
      expect(file).toContain(`DTSTART:${event.start.replace(/[-:]/g, "")}`);
      expect(file).not.toMatch(/DTEND|DURATION/);
      expect(file.replaceAll("\r\n ", "")).toContain(event.venue.address.replaceAll(",", "\\,"));
      expect(file.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75)).toBe(true);
      const links = calendarLinks(event);
      expect(new URL(links.google).searchParams.get("ctz")).toBe("America/Toronto");
      expect(new URL(links.outlook).searchParams.get("startdt")).toBe(event.start);
      expect(decodeURIComponent(links.file.split(",").slice(1).join(","))).toBe(file);
    }
  });

  it("opens the exact venue addresses and keeps the church as the journey origin", () => {
    const journey = new URL(betweenVenues);
    expect(journey.searchParams.get("origin")).toContain("4070 Central Parkway East");
    expect(journey.searchParams.get("destination")).toContain("219 Romina Drive");
    expect(journey.searchParams.get("travelmode")).toBe("driving");
    expect(new URL(directionsTo(weddingEvents[0].venue)).searchParams.has("origin")).toBe(false);
  });
});
