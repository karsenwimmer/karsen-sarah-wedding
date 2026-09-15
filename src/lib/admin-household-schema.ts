import { z } from "zod";
import { MAX_HOUSEHOLD_MEMBERS, normalizeEmail, normalizePostalZip } from "@/lib/household-schema";

export const invitationSources = ["save_the_date", "manual", "bulk_church"] as const;
export const invitationStatuses = ["needs_review", "ready", "invitation_sent"] as const;
export const invitationPackages = ["church_celebration", "full_celebration"] as const;

export type InvitationSource = (typeof invitationSources)[number];
export type InvitationStatus = (typeof invitationStatuses)[number];
export type InvitationPackage = (typeof invitationPackages)[number];

export const invitationSourceLabels: Record<InvitationSource, string> = {
  save_the_date: "Save the Date",
  manual: "Manually added",
  bulk_church: "Bulk church invitation"
};

export const invitationStatusLabels: Record<InvitationStatus, string> = {
  needs_review: "Needs review",
  ready: "Ready",
  invitation_sent: "Invitation sent"
};

export const invitationPackageLabels: Record<InvitationPackage, string> = {
  church_celebration: "Ceremony + Church Reception",
  full_celebration: "Ceremony + Church Reception + Venue"
};

const requiredText = (field: string, max: number) =>
  z.string().trim().min(1, `${field} is required.`).max(max, `${field} must be ${max} characters or fewer.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .max(320, "Email address must be 320 characters or fewer.")
  .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email address.")
  .transform((value) => (value ? normalizeEmail(value) : null));

const memberSchema = z.object({
  firstName: requiredText("First name", 80),
  lastName: requiredText("Last name", 80)
});

export const adminHouseholdSchema = z
  .object({
    householdName: requiredText("Household name", 140),
    primaryFirstName: optionalText(80),
    primaryLastName: optionalText(80),
    primaryEmail: optionalEmail,
    primaryPhone: optionalText(40),
    streetAddress: optionalText(180),
    unit: optionalText(80),
    city: optionalText(100),
    provinceState: optionalText(100),
    postalZip: optionalText(24),
    country: optionalText(80),
    internalNotes: optionalText(2000),
    invitationSource: z.enum(invitationSources),
    invitationStatus: z.enum(invitationStatuses),
    invitationPackage: z.enum(invitationPackages),
    members: z
      .array(memberSchema)
      .min(1, "Add at least one invited person.")
      .max(MAX_HOUSEHOLD_MEMBERS, `Please list no more than ${MAX_HOUSEHOLD_MEMBERS} invited people.`)
  })
  .superRefine((data, context) => {
    const seen = new Set<string>();

    data.members.forEach((member, index) => {
      const key = `${member.firstName} ${member.lastName}`.trim().toLowerCase();

      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Each invited person must appear only once.",
          path: ["members", index, "firstName"]
        });
      }

      seen.add(key);
    });
  });

export type AdminHouseholdInput = z.infer<typeof adminHouseholdSchema> & {
  normalizedEmail: string | null;
  normalizedPostalZip: string | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readMembers(formData: FormData) {
  const memberCount = Number.parseInt(readString(formData, "memberCount"), 10);
  const safeCount = Number.isFinite(memberCount)
    ? Math.min(Math.max(memberCount, 0), MAX_HOUSEHOLD_MEMBERS + 1)
    : 0;

  return Array.from({ length: safeCount }, (_, index) => ({
    firstName: readString(formData, `members.${index}.firstName`),
    lastName: readString(formData, `members.${index}.lastName`)
  }));
}

export function parseAdminHouseholdFormData(formData: FormData) {
  const raw = {
    householdName: readString(formData, "householdName"),
    primaryFirstName: readString(formData, "primaryFirstName"),
    primaryLastName: readString(formData, "primaryLastName"),
    primaryEmail: readString(formData, "primaryEmail"),
    primaryPhone: readString(formData, "primaryPhone"),
    streetAddress: readString(formData, "streetAddress"),
    unit: readString(formData, "unit"),
    city: readString(formData, "city"),
    provinceState: readString(formData, "provinceState"),
    postalZip: readString(formData, "postalZip"),
    country: readString(formData, "country"),
    internalNotes: readString(formData, "internalNotes"),
    invitationSource: readString(formData, "invitationSource"),
    invitationStatus: readString(formData, "invitationStatus"),
    invitationPackage: readString(formData, "invitationPackage"),
    members: readMembers(formData)
  };

  const parsed = adminHouseholdSchema.safeParse(raw);

  if (!parsed.success) {
    return parsed;
  }

  const normalizedPostalZip = parsed.data.postalZip
    ? normalizePostalZip(parsed.data.postalZip, parsed.data.country ?? "")
    : null;

  return {
    success: true as const,
    data: {
      ...parsed.data,
      postalZip: normalizedPostalZip,
      normalizedPostalZip,
      normalizedEmail: parsed.data.primaryEmail
    }
  };
}

export function getAdminHouseholdFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";

    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}
