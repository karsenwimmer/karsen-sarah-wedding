"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  hasAdminSession,
  setAdminSession,
  verifyAdminPassword
} from "@/lib/admin-auth";
import {
  getAdminHouseholdFieldErrors,
  parseAdminHouseholdFormData
} from "@/lib/admin-household-schema";
import type { AdminHouseholdFormState } from "@/lib/admin-household-form-state";
import { saveAdminHousehold } from "@/lib/admin-data";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    redirect("/admin?error=1");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}

async function requireAdminActionSession() {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }
}

function saveFailure(error: unknown): AdminHouseholdFormState {
  const message = error instanceof Error ? error.message : "Unknown household save error";

  console.error("Could not save admin household.", { errorMessage: message });

  if (message.includes("households_normalized_email_key")) {
    return {
      status: "error",
      message: "Another household already uses that email address.",
      fieldErrors: {
        primaryEmail: "Use a different email or update the existing household."
      }
    };
  }

  return {
    status: "error",
    message: "We could not save this household. Please try again.",
    fieldErrors: {}
  };
}

export async function createAdminHousehold(
  _previousState: AdminHouseholdFormState,
  formData: FormData
): Promise<AdminHouseholdFormState> {
  await requireAdminActionSession();

  const parsed = parseAdminHouseholdFormData(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please review the highlighted household details.",
      fieldErrors: getAdminHouseholdFieldErrors(parsed.error)
    };
  }

  let householdId: string;

  try {
    householdId = await saveAdminHousehold(null, parsed.data);
  } catch (error) {
    return saveFailure(error);
  }

  revalidatePath("/admin");
  redirect(`/admin/households/${householdId}?notice=created`);
}

export async function updateAdminHousehold(
  householdId: string,
  _previousState: AdminHouseholdFormState,
  formData: FormData
): Promise<AdminHouseholdFormState> {
  await requireAdminActionSession();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(householdId)) {
    return {
      status: "error",
      message: "This household could not be identified.",
      fieldErrors: {}
    };
  }

  const parsed = parseAdminHouseholdFormData(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please review the highlighted household details.",
      fieldErrors: getAdminHouseholdFieldErrors(parsed.error)
    };
  }

  try {
    await saveAdminHousehold(householdId, parsed.data);
  } catch (error) {
    return saveFailure(error);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/households/${householdId}`);
  redirect(`/admin/households/${householdId}?notice=updated`);
}
