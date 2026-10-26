import { describe, expect, it, vi } from "vitest";
import { lookupStoredInvitation, normalizeInvitationCode, saveStoredInvitation, type InvitationRepository } from "./invitation-replies";
import { invitations, type Reply } from "@/app/invitation/preview-data";

function repository() {
  let saved: Reply | null = null;
  const invite = { ...invitations[2], code: "PRIVATE123", mealsOpen: false };
  const repo: InvitationRepository = {
    findEnabled: vi.fn(async code => code === invite.code ? { id: "household-1", invite } : null),
    latestReply: vi.fn(async () => saved),
    saveReply: vi.fn(async (_id, reply) => { saved = reply; })
  };
  const answers = invite.guests.map(g => ({ id: g.id, attending: "yes", meal: "", dietary: "" }));
  return { repo, invite, answers };
}
describe("server-backed invitation replies", () => {
  it("normalizes codes while rejecting malformed or oversized input", () => {
    expect(normalizeInvitationCode(" private-123 ")).toBe("PRIVATE123");
    for (const value of [null, {}, "bad%code", "short", "x".repeat(65)]) expect(normalizeInvitationCode(value)).toBeNull();
  });
  it("returns unanswered for a valid code, then returns the saved response to a separate lookup", async () => {
    const { repo, answers } = repository();
    expect((await lookupStoredInvitation("PRIVATE123", repo))?.reply).toBeNull();
    const now = new Date("2026-10-26T12:00:00Z");
    const saved = await saveStoredInvitation("PRIVATE123", { answers, note: "Hello", savedAt: "forged" }, repo, now);
    expect(saved?.savedAt).toBe(now.toISOString());
    expect((await lookupStoredInvitation("PRIVATE123", repo))?.reply).toEqual(saved);
    expect(repo.saveReply).toHaveBeenCalledWith("household-1", saved);
  });
  it("rechecks disabled/revoked codes and rejects guest substitution, duplicates and invalid responses", async () => {
    const { repo, answers } = repository();
    expect(await saveStoredInvitation("DISABLED12", { answers, note: "" }, repo)).toBeNull();
    expect(await saveStoredInvitation("PRIVATE123", { answers: [answers[0], answers[0]], note: "" }, repo)).toBeNull();
    expect(await saveStoredInvitation("PRIVATE123", { answers: [{...answers[0],id:"other-household"},answers[1]], note: "" }, repo)).toBeNull();
    expect(await saveStoredInvitation("PRIVATE123", { answers: [{...answers[0],attending:"maybe"},answers[1]], note: "" }, repo)).toBeNull();
    expect(await saveStoredInvitation("PRIVATE123", { answers, note: "x".repeat(1001) }, repo)).toBeNull();
    expect(repo.saveReply).not.toHaveBeenCalled();
  });
  it("strips reception meals for church access and dietary notes for declining guests", async () => {
    const { repo, answers } = repository();
    const saved = await saveStoredInvitation("PRIVATE123", { answers: [{...answers[0], meal:"fish", dietary:"No nuts"},{...answers[1],attending:"no",meal:"chicken",dietary:"remove"}], note:"" }, repo);
    expect(saved?.answers[0]).toMatchObject({meal:"",dietary:"No nuts"});
    expect(saved?.answers[1]).toMatchObject({meal:"",dietary:""});
  });
});
