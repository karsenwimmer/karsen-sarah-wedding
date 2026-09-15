import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminHouseholdInput } from "@/lib/admin-household-schema";

const hasAdminSessionMock = vi.hoisted(() => vi.fn());
const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  hasAdminSession: hasAdminSessionMock
}));

vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock
}));

import { filterAdminHouseholds, saveAdminHousehold, type AdminHousehold } from "@/lib/admin-data";

const household: AdminHousehold = {
  id: "ea329a88-d026-4314-99ac-de3bd9fffe7d",
  householdName: "The Smith Household",
  primaryFirstName: "Alex",
  primaryLastName: "Smith",
  primaryName: "Alex Smith",
  primaryEmail: "alex@example.com",
  primaryPhone: "555-0100",
  streetAddress: "12 Harbour Street",
  unit: null,
  city: "Oakville",
  provinceState: "Ontario",
  postalZip: "L6J 1A1",
  country: "Canada",
  address: ["12 Harbour Street", "Oakville, Ontario L6J 1A1", "Canada"],
  notes: null,
  internalNotes: "Hand deliver.",
  confirmationEmailStatus: "sent",
  coupleNotificationStatus: "sent",
  lastEmailError: null,
  physicalInvitationSent: false,
  invitationSource: "save_the_date",
  invitationStatus: "needs_review",
  invitationPackage: "full_celebration",
  missingInformation: [],
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-02T12:00:00.000Z",
  members: [
    { firstName: "Alex", lastName: "Smith" },
    { firstName: "Jordan", lastName: "Smith" }
  ]
};

const input: AdminHouseholdInput = {
  householdName: "The Smith Household",
  primaryFirstName: "Alex",
  primaryLastName: "Smith",
  primaryEmail: "alex@example.com",
  normalizedEmail: "alex@example.com",
  primaryPhone: null,
  streetAddress: null,
  unit: null,
  city: null,
  provinceState: null,
  postalZip: null,
  normalizedPostalZip: null,
  country: "Canada",
  internalNotes: null,
  invitationSource: "manual",
  invitationStatus: "needs_review",
  invitationPackage: "full_celebration",
  members: [{ firstName: "Alex", lastName: "Smith" }]
};

describe("admin household data", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires an admin session before saving", async () => {
    hasAdminSessionMock.mockResolvedValue(false);

    await expect(saveAdminHousehold(null, input)).rejects.toThrow("Unauthorized");
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("saves household details and members through the atomic database function", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "ea329a88-d026-4314-99ac-de3bd9fffe7d",
      error: null
    });
    hasAdminSessionMock.mockResolvedValue(true);
    createSupabaseAdminClientMock.mockReturnValue({ rpc });

    await expect(saveAdminHousehold(null, input)).resolves.toBe(
      "ea329a88-d026-4314-99ac-de3bd9fffe7d"
    );
    expect(rpc).toHaveBeenCalledWith(
      "admin_save_household",
      expect.objectContaining({
        p_household_id: null,
        p_members: [{ first_name: "Alex", last_name: "Smith" }]
      })
    );
  });

  it("searches across household and member names", () => {
    expect(filterAdminHouseholds([household], { query: "Jordan" })).toEqual([household]);
    expect(filterAdminHouseholds([household], { query: "Not invited" })).toEqual([]);
  });

  it("filters by invitation package and preparation status", () => {
    expect(
      filterAdminHouseholds([household], {
        invitationPackage: "church_celebration",
        invitationStatus: "all"
      })
    ).toEqual([]);
    expect(
      filterAdminHouseholds([household], {
        invitationPackage: "full_celebration",
        invitationStatus: "needs_review"
      })
    ).toEqual([household]);
  });
});
