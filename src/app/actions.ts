"use server";

import { parseHouseholdFormData, getFieldErrors } from "@/lib/household-schema";
import { persistHouseholdSubmission } from "@/lib/household-persistence";
import type { MailingFormState } from "@/lib/mailing-form-state";
import { checkSubmissionRateLimit } from "@/lib/submission-rate-limit";
import { createSupabaseHouseholdRepository } from "@/lib/supabase-households";
import { sendHouseholdConfirmationEmail } from "@/lib/confirmation-email";

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
    const repository = createSupabaseHouseholdRepository();
    const result = await persistHouseholdSubmission(parsed.data, repository);
    const confirmationEmail = await sendHouseholdConfirmationEmail(parsed.data);

    if (confirmationEmail.status !== "sent") {
      console.warn("Confirmation email was not sent.", {
        status: confirmationEmail.status,
        errorMessage: confirmationEmail.errorMessage
      });
    }

    try {
      await repository.updateConfirmationEmailStatus(
        result.householdId,
        confirmationEmail.status,
        confirmationEmail.errorMessage
      );
    } catch (error) {
      console.warn("Could not update confirmation email status.", {
        errorMessage: error instanceof Error ? error.message : "Unknown status update error"
      });
      // The household details are already saved, so a status audit hiccup should not block guests.
    }

    return {
      status: "success",
      message:
        result.status === "updated"
          ? "Thank you. Your mailing details have been updated. Official invitations will be sent at a later date."
          : "Thank you. Your mailing details have been received. Official invitations will be sent at a later date.",
      fieldErrors: {}
    };
  } catch (error) {
    const isMissingConfig =
      error instanceof Error && error.message === "Supabase is not configured.";

    return {
      status: "error",
      message: isMissingConfig
        ? "The mailing form is ready, but Supabase still needs to be connected before submissions can be saved."
        : "We could not save your details just now. Please try again shortly.",
      fieldErrors: {}
    };
  }
}
