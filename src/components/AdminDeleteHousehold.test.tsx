import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDeleteHousehold } from "@/components/AdminDeleteHousehold";

vi.mock("@/app/admin/actions", () => ({
  deleteAdminHousehold: vi.fn(async () => ({
    status: "idle",
    message: "",
    fieldErrors: {}
  }))
}));

describe("AdminDeleteHousehold", () => {
  it("requires the exact household name before enabling deletion", () => {
    render(
      <AdminDeleteHousehold
        householdId="ea329a88-d026-4314-99ac-de3bd9fffe7d"
        householdName="The Smith Household"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete household" }));

    const confirmation = screen.getByLabelText(/Enter The Smith Household to confirm/);
    const deleteButton = screen.getByRole("button", { name: "Permanently delete" });

    expect(deleteButton).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: "The Smith" } });
    expect(deleteButton).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: "The Smith Household" } });
    expect(deleteButton).toBeEnabled();
  });
});
