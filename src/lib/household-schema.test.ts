import { describe, expect, it } from "vitest";
import { parseHouseholdFormData } from "@/lib/household-schema";

function baseFormData(overrides: Record<string, string | undefined> = {}) {
  const formData = new FormData();
  const values: Record<string, string> = {
    primaryFirstName: "Karsen",
    primaryLastName: "Wimmer",
    primaryEmail: "  KARSEN@example.COM ",
    primaryPhone: "555-0100",
    streetAddress: "123 Lakeshore Road",
    unit: "",
    city: "Oakville",
    provinceState: "Ontario",
    postalZip: "l6j1a1",
    country: "Canada",
    notes: "Please use the side entrance.",
    communicationConsent: "on",
    memberCount: "1",
    "members.0.firstName": "Sarah",
    "members.0.lastName": "Wimmer",
    website: "",
    formStartedAt: "1793900000000"
  };

  for (const [key, value] of Object.entries({ ...values, ...overrides })) {
    if (value !== undefined) {
      formData.set(key, value);
    }
  }

  return formData;
}

describe("household form parsing", () => {
  it("normalizes email and Canadian postal code values", () => {
    const parsed = parseHouseholdFormData(baseFormData());

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.primaryEmail).toBe("karsen@example.com");
      expect(parsed.data.normalizedEmail).toBe("karsen@example.com");
      expect(parsed.data.householdName).toBe("Karsen Wimmer");
      expect(parsed.data.postalZip).toBe("L6J 1A1");
      expect(parsed.data.members).toEqual([
        { firstName: "Karsen", lastName: "Wimmer" },
        { firstName: "Sarah", lastName: "Wimmer" }
      ]);
    }
  });

  it("requires a valid primary email address", () => {
    const parsed = parseHouseholdFormData(baseFormData({ primaryEmail: "not an email" }));

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.primaryEmail?.[0]).toBe(
        "Enter a valid email address."
      );
    }
  });

  it("requires communication consent", () => {
    const parsed = parseHouseholdFormData(baseFormData({ communicationConsent: undefined }));

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.communicationConsent?.[0]).toBe(
        "Please agree to receive wedding-related emails from Karsen and Sarah."
      );
    }
  });

  it("rejects more than the allowed household member count", () => {
    const formData = baseFormData({ memberCount: "12" });

    for (let index = 0; index < 12; index += 1) {
      formData.set(`members.${index}.firstName`, `Guest ${index + 1}`);
      formData.set(`members.${index}.lastName`, "Wimmer");
    }

    const parsed = parseHouseholdFormData(formData);

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.members?.[0]).toBe(
        "Please list no more than 12 household members."
      );
    }
  });
});
