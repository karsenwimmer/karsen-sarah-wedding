import { weddingConfig } from "@/config/wedding";

export type CalendarEvent = {
  title: string;
  startDate: string;
  endDate?: string;
  location: string;
  description: string;
  url: string;
  uid?: string;
  timezone?: string;
};

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function compactDate(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.replaceAll("-", "");
  return new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function isAllDay(event: CalendarEvent) { return /^\d{4}-\d{2}-\d{2}$/.test(event.startDate); }

function encode(value: string) {
  return encodeURIComponent(value);
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function foldIcsLine(line: string) {
  const maxLength = 73;
  const parts: string[] = [];
  const encoder = new TextEncoder();
  let current = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > maxLength) {
      parts.push(current); current = ""; bytes = 0;
    }
    current += character; bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export const calendarEvent: CalendarEvent = {
  title: "Karsen & Sarah's Wedding",
  startDate: weddingConfig.date.iso.slice(0, 10),
  endDate: addDays(weddingConfig.date.iso.slice(0, 10), 1),
  location: `${weddingConfig.venue.reception}, ${weddingConfig.venue.receptionLocation.replace(" · ", ", ")}`,
  description: `Save the date for Karsen and Sarah's wedding celebration. Formal invitation and RSVP details will follow. ${weddingConfig.links.websiteUrl}`,
  url: weddingConfig.links.websiteUrl
};

export function createGoogleCalendarUrl(event = calendarEvent) {
  const params = [
    "action=TEMPLATE",
    `text=${encode(event.title)}`,
    `dates=${compactDate(event.startDate)}/${compactDate(event.endDate ?? (isAllDay(event) ? addDays(event.startDate, 1) : event.startDate))}`,
    `details=${encode(event.description)}`,
    `location=${encode(event.location)}`
  ];
  if (event.timezone) params.push(`ctz=${encode(event.timezone)}`);

  return `https://calendar.google.com/calendar/render?${params.join("&")}`;
}

export function createOutlookCalendarUrl(event = calendarEvent) {
  const params = [
    "rru=addevent",
    `subject=${encode(event.title)}`,
    `startdt=${encode(event.startDate)}`,
    ...(event.endDate ? [`enddt=${encode(event.endDate)}`] : []),
    `allday=${isAllDay(event)}`,
    `body=${encode(event.description)}`,
    `location=${encode(event.location)}`
  ];

  return `https://outlook.live.com/calendar/0/action/compose?${params.join("&")}`;
}

export function createIcsCalendarFile(event = calendarEvent, timestamp = "20260808T000000Z") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Wimmers//Save the Date//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid ?? "karsen-sarah-wedding-20270717@thewimmers.ca"}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART${isAllDay(event) ? ";VALUE=DATE" : ""}:${compactDate(event.startDate)}`,
    ...(event.endDate ? [`DTEND${isAllDay(event) ? ";VALUE=DATE" : ""}:${compactDate(event.endDate)}`] : []),
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
