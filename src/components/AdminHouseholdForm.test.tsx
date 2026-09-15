import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminHouseholdForm } from "@/components/AdminHouseholdForm";

vi.mock("@/app/admin/actions", () => ({
  createAdminHousehold: vi.fn(async () => ({
    status: "idle",
    message: "",
    fieldErrors: {}
  })),
  updateAdminHousehold: vi.fn(async () => ({
    status: "idle",
    message: "",
    fieldErrors: {}
  }))
}));

describe("AdminHouseholdForm", () => {
  it("starts a manual full invitation and manages invited people", () => {
    render(<AdminHouseholdForm />);

    expect(screen.getByLabelText("List source")).toHaveValue("manual");
    expect(screen.getByLabelText("Preparation status")).toHaveValue("needs_review");
    expect(
      screen.getByRole("radio", { name: /Ceremony \+ Church Reception \+ Venue/ })
    ).toBeChecked();

    const initialRemove = screen.getByRole("button", { name: "Remove" });
    expect(initialRemove).toBeDisabled();
    expect(screen.getAllByLabelText("First name *")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Add another person" }));

    expect(screen.getAllByLabelText("First name *")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Remove" })[0]).toBeEnabled();
  });
});
