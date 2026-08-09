import type { HouseholdMemberInput, HouseholdSubmission } from "@/lib/household-schema";

export type HouseholdRecord = {
  id: string;
};

export type HouseholdSaveResult = {
  householdId: string;
  status: "created" | "updated";
};

export type ConfirmationEmailStatus = "sent" | "failed" | "not_configured";

export type HouseholdRepository = {
  findByNormalizedEmail(normalizedEmail: string): Promise<HouseholdRecord | null>;
  createHousehold(input: HouseholdSubmission): Promise<HouseholdRecord>;
  updateHousehold(id: string, input: HouseholdSubmission): Promise<HouseholdRecord>;
  replaceMembers(householdId: string, members: HouseholdMemberInput[]): Promise<void>;
  updateConfirmationEmailStatus(
    householdId: string,
    status: ConfirmationEmailStatus,
    errorMessage?: string | null
  ): Promise<void>;
  logSubmissionEvent(
    householdId: string,
    eventType: "household_created" | "household_updated",
    metadata?: Record<string, unknown>
  ): Promise<void>;
};

export async function persistHouseholdSubmission(
  input: HouseholdSubmission,
  repository: HouseholdRepository
): Promise<HouseholdSaveResult> {
  const existing = await repository.findByNormalizedEmail(input.normalizedEmail);

  if (existing) {
    const household = await repository.updateHousehold(existing.id, input);
    await repository.replaceMembers(household.id, input.members);
    await repository.logSubmissionEvent(household.id, "household_updated", {
      member_count: input.members.length
    });

    return {
      householdId: household.id,
      status: "updated"
    };
  }

  const household = await repository.createHousehold(input);
  await repository.replaceMembers(household.id, input.members);
  await repository.logSubmissionEvent(household.id, "household_created", {
    member_count: input.members.length
  });

  return {
    householdId: household.id,
    status: "created"
  };
}
