import { createIcsCalendarFile } from "@/lib/calendar";

export function GET() {
  return new Response(createIcsCalendarFile(), {
    headers: {
      "Content-Disposition": 'attachment; filename="karsen-sarah-save-the-date.ics"',
      "Content-Type": "text/calendar; charset=utf-8"
    }
  });
}
