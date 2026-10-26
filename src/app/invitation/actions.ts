"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { checkSubmissionRateLimit } from "@/lib/submission-rate-limit";
import { lookupStoredInvitation, saveStoredInvitation } from "@/lib/invitation-replies";
import { createInvitationRepository } from "@/lib/supabase-invitation-replies";

async function allowed(operation: string) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = createHash("sha256").update(`invitation:${operation}:${ip}`).digest("hex");
  return checkSubmissionRateLimit(key).allowed;
}
export async function lookupInvitation(code: unknown) {
  try {
    if (!await allowed("lookup")) return { ok: false as const, message: "Please wait a few minutes before trying again." };
    const result = await lookupStoredInvitation(code, createInvitationRepository());
    return result ? { ok: true as const, ...result } : { ok: false as const, message: "We couldn’t find an open invitation with that code. Please check your invitation and try again." };
  } catch {
    return { ok: false as const, message: "Invitation access is unavailable right now. You can explore this preview with HARBOUR, FAMILY or CHURCH." };
  }
}
export async function saveInvitationReply(code: unknown, payload: unknown) {
  try {
    if (!await allowed("save")) return { ok: false as const, message: "Please wait a few minutes before saving another change." };
    const reply = await saveStoredInvitation(code, payload, createInvitationRepository());
    return reply ? { ok: true as const, reply } : { ok: false as const, message: "We couldn’t save that reply. Please reopen your invitation and check your answers." };
  } catch {
    return { ok: false as const, message: "We couldn’t save your reply just now. Your form is still open; please try again." };
  }
}
