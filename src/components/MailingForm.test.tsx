import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MailingForm } from "@/components/MailingForm";

vi.mock("@/app/actions", () => ({
  submitMailingInformation: vi.fn(async () => ({
    status: "error",
    message: "Please review the highlighted fields.",
    fieldErrors: {
      city: "City is required.",
      provinceState: "Province or state is required.",
      postalZip: "Postal or ZIP code is required."
    }
  }))
}));

describe("MailingForm", () => {
  it("requires email consent before saving and keeps entered values after errors", async () => {
    render(<MailingForm />);

    const submitButton = screen.getByRole("button", { name: "Save Our Details" });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Primary contact first name/), {
      target: { value: "Karsen" }
    });
    fireEvent.change(screen.getByLabelText(/Primary contact last name/), {
      target: { value: "Wimmer" }
    });
    fireEvent.change(screen.getByLabelText(/Primary email address/), {
      target: { value: "test@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/Street address/), {
      target: { value: "123 Test Street" }
    });

    fireEvent.click(screen.getByLabelText(/I agree to receive wedding-related emails/));
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please finish this before saving: City is required. Province or state is required. Postal or ZIP code is required."
      )
    );

    expect(screen.getByLabelText(/Primary contact first name/)).toHaveValue("Karsen");
    expect(screen.getByLabelText(/Primary contact last name/)).toHaveValue("Wimmer");
    expect(screen.getByLabelText(/Primary email address/)).toHaveValue("test@example.com");
    expect(screen.getByLabelText(/Street address/)).toHaveValue("123 Test Street");
    expect(screen.getByLabelText(/I agree to receive wedding-related emails/)).toBeChecked();
  });
});
