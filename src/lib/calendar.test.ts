import { describe, expect, it } from "vitest";
import {
  calendarEvent,
  createGoogleCalendarUrl,
  createIcsCalendarFile,
  createOutlookCalendarUrl
} from "@/lib/calendar";

describe("calendar links", () => {
  it("creates all-day Google Calendar links for the save the date", () => {
    const url = createGoogleCalendarUrl();

    expect(url).toContain("calendar.google.com/calendar/render");
    expect(url).toContain("dates=20270717/20270718");
    expect(decodeURIComponent(url)).toContain(calendarEvent.title);
    expect(decodeURIComponent(url)).toContain("Formal invitation and RSVP details will follow.");
  });

  it("creates all-day Outlook links for the save the date", () => {
    const url = createOutlookCalendarUrl();

    expect(url).toContain("outlook.live.com/calendar/0/action/compose");
    expect(url).toContain("startdt=2027-07-17");
    expect(url).toContain("enddt=2027-07-18");
    expect(url).toContain("allday=true");
  });

  it("creates an ICS file that calendar apps can import", () => {
    const ics = createIcsCalendarFile();

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270717");
    expect(ics).toContain("DTEND;VALUE=DATE:20270718");
    expect(ics).toContain("SUMMARY:Karsen & Sarah's Wedding");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("keeps Toronto summer times correct in each calendar format", () => {
    const event = { ...calendarEvent, title: "The Ceremony", startDate: "2027-07-17T13:00:00-04:00", endDate: "2027-07-17T14:00:00-04:00", timezone: "America/Toronto", uid: "ceremony@thewimmers.ca" };
    const google = new URL(createGoogleCalendarUrl(event));
    expect(google.searchParams.get("dates")).toBe("20270717T170000Z/20270717T180000Z");
    expect(google.searchParams.get("ctz")).toBe("America/Toronto");
    const outlook = new URL(createOutlookCalendarUrl(event));
    expect(outlook.searchParams.get("allday")).toBe("false");
    expect(outlook.searchParams.get("startdt")).toBe("2027-07-17T13:00:00-04:00");
    const ics = createIcsCalendarFile(event);
    expect(ics).toContain("UID:ceremony@thewimmers.ca");
    expect(ics).toContain("DTSTART:20270717T170000Z");
    expect(ics).toContain("DTEND:20270717T180000Z");
    expect(ics).not.toContain("VALUE=DATE");
  });

  it("supports start-only entries without inventing an end time", () => {
    const event = { ...calendarEvent, startDate: "2027-07-17T18:00:00-04:00", endDate: undefined };
    expect(createIcsCalendarFile(event)).toContain("DTSTART:20270717T220000Z");
    expect(createIcsCalendarFile(event)).not.toContain("DTEND");
    expect(new URL(createOutlookCalendarUrl(event)).searchParams.has("enddt")).toBe(false);
    expect(new URL(createGoogleCalendarUrl(event)).searchParams.get("dates")).toBe("20270717T220000Z/20270717T220000Z");
  });

  it("folds long Unicode venue text without splitting characters or exceeding the ICS byte limit", () => {
    const description = "St. Mary’s Parish — Hamilton, Ontario. ".repeat(8);
    const ics = createIcsCalendarFile({ ...calendarEvent, description });
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics.replaceAll("\r\n ", "")).toContain(`DESCRIPTION:${description.replaceAll(",", "\\,")}`);
  });
});
