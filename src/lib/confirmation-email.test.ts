import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildConfirmationEmail,
  sendHouseholdConfirmationEmail
} from "@/lib/confirmation-email";
import type { HouseholdSubmission } from "@/lib/household-schema";

function submission(overrides: Partial<HouseholdSubmission> = {}): HouseholdSubmission {
  return {
    householdName: "The Wimmer Household",
    primaryFirstName: "Karsen",
    primaryLastName: "Wimmer",
    primaryEmail: "karsen@example.com",
    normalizedEmail: "karsen@example.com",
    primaryPhone: null,
    streetAddress: "123 Lakeshore Road",
    unit: null,
    city: "Oakville",
    provinceState: "Ontario",
    postalZip: "L6J 1A1",
    normalizedPostalZip: "L6J 1A1",
    country: "Canada",
    notes: null,
    communicationConsent: true,
    members: [
      {
        firstName: "Karsen",
        lastName: "Wimmer"
      }
    ],
    honeypot: "",
    formStartedAt: 1793900000000,
    ...overrides
  };
}

describe("confirmation email", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("builds a clear not-RSVP confirmation email", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://thewimmers.ca");

    const email = buildConfirmationEmail(submission());

    expect(email.subject).toBe("We received your wedding mailing details");
    expect(email.text).toContain("Hi Karsen");
    expect(email.text).toContain("This is not an RSVP.");
    expect(email.text).toContain("https://thewimmers.ca");
    expect(email.html).toContain("Thank you, Karsen");
    expect(email.html).toContain("Visit the wedding website");
  });

  it("does not call Resend when email is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendHouseholdConfirmationEmail(submission())).resolves.toEqual({
      status: "not_configured"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the confirmation email through Resend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "wedding@thewimmers.ca");
    vi.stubEnv("RESEND_REPLY_TO", "reply@thewimmers.ca");

    await expect(sendHouseholdConfirmationEmail(submission())).resolves.toEqual({
      status: "sent"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key"
        })
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      from: "Karsen & Sarah <wedding@thewimmers.ca>",
      reply_to: "reply@thewimmers.ca",
      subject: "We received your wedding mailing details",
      to: "karsen@example.com"
    });
  });

  it("returns failed when Resend rejects the email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Domain is not verified" }),
        statusText: "Bad Request"
      })
    );
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "wedding@thewimmers.ca");

    await expect(sendHouseholdConfirmationEmail(submission())).resolves.toEqual({
      status: "failed",
      errorMessage: "Domain is not verified"
    });
  });
});
