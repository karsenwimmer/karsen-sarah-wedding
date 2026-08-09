import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCoupleNotificationEmail,
  sendCoupleNotificationEmail
} from "@/lib/couple-notification-email";
import type { HouseholdSubmission } from "@/lib/household-schema";

function submission(overrides: Partial<HouseholdSubmission> = {}): HouseholdSubmission {
  return {
    householdName: "Karsen Wimmer",
    primaryFirstName: "Karsen",
    primaryLastName: "Wimmer",
    primaryEmail: "karsen@example.com",
    normalizedEmail: "karsen@example.com",
    primaryPhone: "555-0100",
    streetAddress: "123 Lakeshore Road",
    unit: null,
    city: "Oakville",
    provinceState: "Ontario",
    postalZip: "L6J 1A1",
    normalizedPostalZip: "L6J 1A1",
    country: "Canada",
    notes: "Please use the side entrance.",
    communicationConsent: true,
    members: [
      {
        firstName: "Karsen",
        lastName: "Wimmer"
      },
      {
        firstName: "Sarah",
        lastName: "Wimmer"
      }
    ],
    honeypot: "",
    formStartedAt: 1793900000000,
    ...overrides
  };
}

describe("couple notification email", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("builds a useful new-submission notification", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://thewimmers.ca");

    const email = buildCoupleNotificationEmail(submission(), "created");

    expect(email.subject).toBe("New mailing details: Karsen Wimmer");
    expect(email.text).toContain("karsen@example.com");
    expect(email.text).toContain("123 Lakeshore Road");
    expect(email.text).toContain("Sarah Wimmer");
    expect(email.text).toContain("https://thewimmers.ca/admin");
    expect(email.html).toContain("Open admin dashboard");
  });

  it("does not call Resend when the couple recipient is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendCoupleNotificationEmail(submission(), "created")).resolves.toEqual({
      status: "not_configured"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends to comma-separated couple notification recipients", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "wedding@thewimmers.ca");
    vi.stubEnv("COUPLE_NOTIFICATION_EMAIL", "one@example.com, two@example.com");

    await expect(sendCoupleNotificationEmail(submission(), "updated")).resolves.toEqual({
      status: "sent"
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      subject: "Updated mailing details: Karsen Wimmer",
      to: ["one@example.com", "two@example.com"]
    });
  });
});
