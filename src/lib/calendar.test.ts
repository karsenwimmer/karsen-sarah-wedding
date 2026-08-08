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
});
