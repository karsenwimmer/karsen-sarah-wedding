export type AdminHouseholdFormState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: Record<string, string>;
};

export const initialAdminHouseholdFormState: AdminHouseholdFormState = {
  status: "idle",
  message: "",
  fieldErrors: {}
};
