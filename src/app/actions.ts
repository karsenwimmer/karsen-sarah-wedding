"use server";

import { parseHouseholdFormData, getFieldErrors } from "@/lib/household-schema";
import { persistHouseholdSubmission } from "@/lib/household-persistence";
import type { MailingFormState } from "@/lib/mailing-form-state";
import { checkSubmissionRateLimit } from "@/lib/submission-rate-limit";
import { createSupabaseHouseholdRepository } from "@/lib/supabase-households";

export async function submitMailingInformation(
  _previousState: MailingFormState,
  formData: FormData
): Promise<MailingFormState> {
  const parsed = parseHouseholdFormData(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please review the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  if (parsed.data.formStartedAt && Date.now() - parsed.data.formStartedAt < 1500) {
    return {
      status: "error",
      message: "Please try again in a moment.",
      fieldErrors: {}
    };
  }

  const rateLimit = checkSubmissionRateLimit(parsed.data.normalizedEmail);

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "Please wait a few minutes before submitting again.",
      fieldErrors: {}
    };
  }

  try {
    const result = await persistHouseholdSubmission(
      parsed.data,
      createSupabaseHouseholdRepository()
    );

    return {
      status: "success",
      message:
        result.status === "updated"
          ? "Your household information has been updated."
          : "Thank you. Your household information has been received. We look forward to celebrating with you on 07 - 17 - 27.",
      fieldErrors: {}
    };
  } catch (error) {
    const isMissingConfig =
      error instanceof Error && error.message === "Supabase is not configured.";

    console.error("Household submission failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return {
      status: "error",
      message: isMissingConfig
        ? "The mailing form is ready, but Supabase still needs to be connected before submissions can be saved."
        : "We could not save your details just now. Please try again shortly.",
      fieldErrors: {}
    };
  }
}
