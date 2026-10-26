import { readReply, type Invite, type Reply } from "@/app/invitation/preview-data";

export type InvitationRecord = { id: string; invite: Invite };
export type InvitationRepository = {
  findEnabled(code: string): Promise<InvitationRecord | null>;
  latestReply(householdId: string): Promise<unknown | null>;
  saveReply(householdId: string, reply: Reply): Promise<void>;
};
export function normalizeInvitationCode(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 64) return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z0-9]{8,32}$/.test(code) ? code : null;
}
export async function lookupStoredInvitation(raw: unknown, repository: InvitationRepository) {
  const code = normalizeInvitationCode(raw);
  if (!code) return null;
  const record = await repository.findEnabled(code);
  if (!record) return null;
  const stored = await repository.latestReply(record.id);
  return { invite: record.invite, reply: readReply(record.invite, JSON.stringify(stored)) };
}
export async function saveStoredInvitation(raw: unknown, payload: unknown, repository: InvitationRepository, now = new Date()) {
  const code = normalizeInvitationCode(raw);
  if (!code) return null;
  // Verify the invitation again for every save, including revocation and event access.
  const record = await repository.findEnabled(code);
  if (!record || !payload || typeof payload !== "object" || !("answers" in payload) || !("note" in payload)) return null;
  const answers = payload.answers;
  if (!Array.isArray(answers) || answers.length !== record.invite.guests.length ||
    new Set(answers.map(answer => answer?.id)).size !== answers.length) return null;
  const reply = readReply(record.invite, JSON.stringify({ answers, note: payload.note, savedAt: now.toISOString() }));
  if (!reply) return null;
  await repository.saveReply(record.id, reply);
  return reply;
}
