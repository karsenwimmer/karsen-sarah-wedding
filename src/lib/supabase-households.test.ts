import { afterEach, describe, expect, it, vi } from "vitest";
import type { HouseholdSubmission } from "@/lib/household-schema";

const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock
}));

import { createSupabaseHouseholdRepository } from "@/lib/supabase-households";

const submission: HouseholdSubmission = {
  householdName: "Alex Smith",
  primaryFirstName: "Alex",
  primaryLastName: "Smith",
  primaryEmail: "alex@example.com",
  normalizedEmail: "alex@example.com",
  primaryPhone: null,
  streetAddress: "12 Harbour Street",
  unit: null,
  city: "Oakville",
  provinceState: "Ontario",
  postalZip: "L6J 1A1",
  normalizedPostalZip: "L6J 1A1",
  country: "Canada",
  notes: null,
  communicationConsent: true,
  members: [{ firstName: "Alex", lastName: "Smith" }],
  honeypot: "",
  formStartedAt: 1793900000000
};

describe("Supabase household repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("classifies new Save the Date submissions as full invitations needing review", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "household-id" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({ insert })
    });

    const repository = createSupabaseHouseholdRepository();
    await repository.createHousehold(submission);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        invitation_source: "save_the_date",
        invitation_status: "needs_review",
        invitation_package: "full_celebration"
      })
    );
  });

  it("does not overwrite invitation decisions when a household updates its contact details", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "household-id" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({ update })
    });

    const repository = createSupabaseHouseholdRepository();
    await repository.updateHousehold("household-id", submission);

    const updatedValues = update.mock.calls[0][0];
    expect(updatedValues).not.toHaveProperty("invitation_source");
    expect(updatedValues).not.toHaveProperty("invitation_status");
    expect(updatedValues).not.toHaveProperty("invitation_package");
  });
});
