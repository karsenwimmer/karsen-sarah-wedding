import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { InvitationRepository } from "./invitation-replies";

// Uses the existing append-only submission_events table. No schema change or preview households.
export function createInvitationRepository(): InvitationRepository {
  const db = createSupabaseAdminClient();
  return {
    async findEnabled(code) {
      const result = await db.from("households")
        .select("id,household_name,invitation_package")
        .eq("rsvp_short_code", code).eq("rsvp_enabled", true)
        .is("rsvp_token_revoked_at", null).maybeSingle();
      if (result.error) throw new Error("Invitation lookup failed.");
      if (!result.data) return null;
      const members = await db.from("household_members").select("id,first_name,last_name")
        .eq("household_id", result.data.id).order("display_order");
      if (members.error) throw new Error("Invitation members unavailable.");
      if (!members.data?.length) return null;
      return { id: result.data.id, invite: {
        code, name: result.data.household_name,
        reception: result.data.invitation_package === "full_celebration",
        // The real menu has not been finalized. Live invitations can record attendance and dietary notes.
        mealsOpen: false,
        guests: members.data.map(member => ({ id: member.id, name: `${member.first_name} ${member.last_name}`.trim() }))
      } };
    },
    async latestReply(householdId) {
      const { data, error } = await db.from("submission_events").select("metadata")
        .eq("household_id", householdId).eq("event_type", "rsvp_response")
        .eq("source", "formal_invitation").order("created_at", { ascending: false })
        .order("id", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error("Saved reply unavailable.");
      return data?.metadata ?? null;
    },
    async saveReply(householdId, reply) {
      const { error } = await db.from("submission_events").insert({
        household_id: householdId, event_type: "rsvp_response", source: "formal_invitation", metadata: reply
      });
      if (error) throw new Error("Could not save reply.");
      // The event is the authoritative response; administrative timestamps are best effort.
      const status = await db.from("households").update({
        rsvp_completed_at: reply.savedAt, rsvp_last_updated_at: reply.savedAt
      }).eq("id", householdId);
      if (status.error) console.warn("RSVP saved; administrative timestamps could not be updated.");
    }
  };
}
