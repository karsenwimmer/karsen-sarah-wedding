import { describe, expect, it } from "vitest";
import {
  getAdminHouseholdFieldErrors,
  parseAdminHouseholdFormData
} from "@/lib/admin-household-schema";

function formData(overrides: Record<string, string> = {}) {
  const values = {
    householdName: "The Smith Household",
    primaryFirstName: "Alex",
    primaryLastName: "Smith",
    primaryEmail: " ALEX@EXAMPLE.COM ",
    primaryPhone: "",
    streetAddress: "",
    unit: "",
    city: "",
    provinceState: "",
    postalZip: "",
    country: "Canada",
    internalNotes: "Hand deliver invitation.",
    invitationSource: "manual",
    invitationStatus: "needs_review",
    invitationPackage: "full_celebration",
    memberCount: "2",
    "members.0.firstName": "Alex",
    "members.0.lastName": "Smith",
    "members.1.firstName": "Jordan",
    "members.1.lastName": "Smith",
    ...overrides
  };
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("admin household form parsing", () => {
  it("allows incomplete contact information and normalizes supplied values", () => {
    const parsed = parseAdminHouseholdFormData(formData());

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.primaryEmail).toBe("alex@example.com");
      expect(parsed.data.normalizedEmail).toBe("alex@example.com");
      expect(parsed.data.streetAddress).toBeNull();
      expect(parsed.data.members).toHaveLength(2);
    }
  });

  it("requires at least one invited person", () => {
    const parsed = parseAdminHouseholdFormData(formData({ memberCount: "0" }));

    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate invited people", () => {
    const parsed = parseAdminHouseholdFormData(
      formData({
        "members.1.firstName": " alex ",
        "members.1.lastName": "SMITH"
      })
    );

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(getAdminHouseholdFieldErrors(parsed.error)["members.1.firstName"]).toBe(
        "Each invited person must appear only once."
      );
    }
  });

  it("rejects invalid invitation permissions", () => {
    const parsed = parseAdminHouseholdFormData(
      formData({ invitationPackage: "venue_only" })
    );

    expect(parsed.success).toBe(false);
  });
});
