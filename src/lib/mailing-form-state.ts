export type MailingFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Record<string, string>;
};

export const initialMailingFormState: MailingFormState = {
  status: "idle",
  message: "",
  fieldErrors: {}
};
