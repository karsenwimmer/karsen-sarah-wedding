import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  HouseholdMemberInput,
  HouseholdSubmission
} from "@/lib/household-schema";
import type {
  HouseholdRecord,
  HouseholdRepository
} from "@/lib/household-persistence";

function toHouseholdRow(input: HouseholdSubmission) {
  return {
    household_name: input.householdName,
    primary_first_name: input.primaryFirstName,
    primary_last_name: input.primaryLastName,
    primary_email: input.primaryEmail,
    normalized_email: input.normalizedEmail,
    primary_phone: input.primaryPhone,
    street_address: input.streetAddress,
    unit: input.unit,
    city: input.city,
    province_state: input.provinceState,
    postal_zip: input.normalizedPostalZip,
    country: input.country,
    notes: input.notes,
    communication_consent: input.communicationConsent,
    confirmation_email_status: "not_configured",
    couple_notification_status: "not_configured"
  };
}

function toMemberRows(householdId: string, members: HouseholdMemberInput[]) {
  return members.map((member, index) => ({
    household_id: householdId,
    first_name: member.firstName,
    last_name: member.lastName,
    display_order: index
  }));
}

function throwIfSupabaseError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export function createSupabaseHouseholdRepository(): HouseholdRepository {
  const supabase = createSupabaseAdminClient();

  return {
    async findByNormalizedEmail(normalizedEmail: string) {
      const { data, error } = await supabase
        .from("households")
        .select("id")
        .eq("normalized_email", normalizedEmail)
        .maybeSingle();

      throwIfSupabaseError(error);
      return data as HouseholdRecord | null;
    },

    async createHousehold(input: HouseholdSubmission) {
      const { data, error } = await supabase
        .from("households")
        .insert(toHouseholdRow(input))
        .select("id")
        .single();

      throwIfSupabaseError(error);
      return data as HouseholdRecord;
    },

    async updateHousehold(id: string, input: HouseholdSubmission) {
      const { data, error } = await supabase
        .from("households")
        .update(toHouseholdRow(input))
        .eq("id", id)
        .select("id")
        .single();

      throwIfSupabaseError(error);
      return data as HouseholdRecord;
    },

    async replaceMembers(householdId: string, members: HouseholdMemberInput[]) {
      const deleteResult = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", householdId);

      throwIfSupabaseError(deleteResult.error);

      const insertResult = await supabase
        .from("household_members")
        .insert(toMemberRows(householdId, members));

      throwIfSupabaseError(insertResult.error);
    },

    async logSubmissionEvent(householdId, eventType, metadata) {
      const { error } = await supabase.from("submission_events").insert({
        household_id: householdId,
        event_type: eventType,
        source: "public_form",
        metadata: metadata ?? null
      });

      throwIfSupabaseError(error);
    }
  };
}
