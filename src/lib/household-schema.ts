import { z } from "zod";

export const MAX_HOUSEHOLD_MEMBERS = 12;

const requiredText = (field: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required.`)
    .max(max, `${field} must be ${max} characters or fewer.`);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value ? value : null));

const memberSchema = z.object({
  firstName: requiredText("First name", 80),
  lastName: requiredText("Last name", 80)
});

export const householdSubmissionSchema = z.object({
  householdName: requiredText("Household or family name", 140),
  primaryFirstName: requiredText("Primary contact first name", 80),
  primaryLastName: requiredText("Primary contact last name", 80),
  primaryEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(320, "Email address must be 320 characters or fewer."),
  primaryPhone: optionalText(40),
  streetAddress: requiredText("Street address", 180),
  unit: optionalText(80),
  city: requiredText("City", 100),
  provinceState: requiredText("Province or state", 100),
  postalZip: requiredText("Postal or ZIP code", 24),
  country: requiredText("Country", 80).default("Canada"),
  notes: optionalText(1000),
  communicationConsent: z.literal(true, {
    error: "Please agree to receive wedding-related emails from Karsen and Sarah."
  }),
  members: z
    .array(memberSchema)
    .min(1, "Add at least one household member.")
    .max(MAX_HOUSEHOLD_MEMBERS, `Please list no more than ${MAX_HOUSEHOLD_MEMBERS} household members.`),
  honeypot: z.string().max(0, "Unable to save this submission."),
  formStartedAt: z.number().nullable()
});

export type HouseholdSubmission = z.infer<typeof householdSubmissionSchema> & {
  normalizedEmail: string;
  normalizedPostalZip: string;
};

export type HouseholdMemberInput = HouseholdSubmission["members"][number];

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePostalZip(value: string, country: string): string {
  const trimmed = value.trim();

  if (country.trim().toLowerCase() === "canada") {
    const compact = trimmed.replace(/\s+/g, "").toUpperCase();
    return compact.length === 6 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact;
  }

  return trimmed.toUpperCase();
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readMembers(formData: FormData): HouseholdMemberInput[] {
  const primaryFirstName = readString(formData, "primaryFirstName");
  const primaryLastName = readString(formData, "primaryLastName");
  const memberCount = Number.parseInt(readString(formData, "memberCount"), 10);
  const additionalCount = Number.isFinite(memberCount) ? Math.max(memberCount, 0) : 0;
  const members: HouseholdMemberInput[] = [
    {
      firstName: primaryFirstName,
      lastName: primaryLastName
    }
  ];

  for (let index = 0; index < additionalCount; index += 1) {
    const firstName = readString(formData, `members.${index}.firstName`);
    const lastName = readString(formData, `members.${index}.lastName`);

    if (firstName.trim() || lastName.trim()) {
      members.push({ firstName, lastName });
    }
  }

  return members;
}

export function parseHouseholdFormData(formData: FormData) {
  const country = readString(formData, "country") || "Canada";
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
    country,
    notes: readString(formData, "notes"),
    communicationConsent: formData.get("communicationConsent") === "on",
    members: readMembers(formData),
    honeypot: readString(formData, "website"),
    formStartedAt: Number.parseInt(readString(formData, "formStartedAt"), 10) || null
  };

  const parsed = householdSubmissionSchema.safeParse(raw);

  if (!parsed.success) {
    return parsed;
  }

  const normalizedEmail = normalizeEmail(parsed.data.primaryEmail);
  const normalizedPostalZip = normalizePostalZip(parsed.data.postalZip, parsed.data.country);

  return {
    success: true as const,
    data: {
      ...parsed.data,
      primaryEmail: normalizedEmail,
      normalizedEmail,
      postalZip: normalizedPostalZip,
      normalizedPostalZip
    }
  };
}

export function getFieldErrors(error: z.ZodError) {
  const flattened = error.flatten();
  const errors: Record<string, string> = {};
  const fieldErrors = flattened.fieldErrors as Record<string, string[] | undefined>;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) {
      errors[field] = messages[0];
    }
  }

  return errors;
}
