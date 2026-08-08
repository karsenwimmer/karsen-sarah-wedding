import { describe, expect, it } from "vitest";
import type { HouseholdRepository } from "@/lib/household-persistence";
import { persistHouseholdSubmission } from "@/lib/household-persistence";
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

function createRepository(existingId?: string) {
  const calls: string[] = [];
  const repository: HouseholdRepository = {
    async findByNormalizedEmail() {
      calls.push("find");
      return existingId ? { id: existingId } : null;
    },
    async createHousehold() {
      calls.push("create");
      return { id: "new-household" };
    },
    async updateHousehold(id) {
      calls.push(`update:${id}`);
      return { id };
    },
    async replaceMembers(householdId) {
      calls.push(`replace:${householdId}`);
    },
    async logSubmissionEvent(householdId, eventType, metadata) {
      calls.push(`${eventType}:${householdId}:${metadata?.member_count}`);
    }
  };

  return { calls, repository };
}

describe("persistHouseholdSubmission", () => {
  it("creates a new household and logs the submission", async () => {
    const { calls, repository } = createRepository();

    await expect(persistHouseholdSubmission(submission(), repository)).resolves.toEqual({
      householdId: "new-household",
      status: "created"
    });

    expect(calls).toEqual([
      "find",
      "create",
      "replace:new-household",
      "household_created:new-household:1"
    ]);
  });

  it("updates an existing household and replaces members", async () => {
    const { calls, repository } = createRepository("existing-household");

    await expect(
      persistHouseholdSubmission(
        submission({
          members: [
            { firstName: "Karsen", lastName: "Wimmer" },
            { firstName: "Sarah", lastName: "Wimmer" }
          ]
        }),
        repository
      )
    ).resolves.toEqual({
      householdId: "existing-household",
      status: "updated"
    });

    expect(calls).toEqual([
      "find",
      "update:existing-household",
      "replace:existing-household",
      "household_updated:existing-household:2"
    ]);
  });
});
