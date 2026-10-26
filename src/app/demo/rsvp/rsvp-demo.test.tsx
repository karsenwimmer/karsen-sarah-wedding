import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RsvpDemo } from "./rsvp-demo";
import { demoInvitations, readResponse, storageKey } from "./demo-data";

function open(code = "ROSE24") {
  fireEvent.change(screen.getByRole("textbox", { name: "Enter your code" }), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: /Open my invitation/ }));
}

beforeEach(() => { window.localStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("isolated wedding RSVP demo", () => {
  it("rejects unknown codes and opens only the selected household with a normalized code", () => {
    render(<RsvpDemo />);
    open("INVALID");
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t find");
    open(" rose-24 ");
    expect(screen.getByText("Jordan Morgan")).toBeVisible();
    expect(screen.queryByText("Sam Bennett")).not.toBeInTheDocument();
  });

  it("validates each guest and meal, saves a mixed response, reloads it and supports editing", () => {
    const view = render(<RsvpDemo />);
    open();
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    const jordan = screen.getByRole("group", { name: /Jordan Morgan/ });
    const taylor = screen.getByRole("group", { name: /Taylor Morgan/ });
    fireEvent.click(within(jordan).getByLabelText("Joyfully attending"));
    fireEvent.click(within(taylor).getByLabelText("Respectfully declining"));
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("choose a meal");
    fireEvent.change(screen.getByLabelText("Meal for Jordan"), { target: { value: "salmon" } });
    fireEvent.change(screen.getByLabelText(/Dietary requirements for Jordan/), { target: { value: "No nuts" } });
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("DEMO RESPONSE SAVED")).toBeVisible();
    expect(screen.getByText("Lemon & dill salmon")).toBeVisible();
    expect(screen.getByText("Dietary requirements: No nuts")).toBeVisible();
    expect(window.localStorage.getItem(storageKey(demoInvitations[0]))).toContain('"attendance":"no"');
    view.unmount();
    render(<RsvpDemo />); open();
    expect(screen.getByRole("button", { name: /Edit my response/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Edit my response/ }));
    expect(screen.getByLabelText("Meal for Jordan")).toHaveValue("salmon");
    fireEvent.click(within(screen.getByRole("group", { name: /Jordan Morgan/ })).getByLabelText("Respectfully declining"));
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("Thank you for letting us know.")).toBeVisible();
    const saved = JSON.parse(window.localStorage.getItem(storageKey(demoInvitations[0]))!);
    expect(saved.guests[0]).toMatchObject({ meal: "", dietary: "", attendance: "no" });
  });

  it("offers children’s meals for the family and keeps ceremony-only invitations free of reception details", () => {
    render(<RsvpDemo />); open("OAK123");
    fireEvent.click(within(screen.getByRole("group", { name: /Avery Bennett/ })).getByLabelText("Joyfully attending"));
    expect(within(screen.getByLabelText("Meal for Avery")).getByRole("option", { name: "Children’s meal" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try another code/ }));
    open("FERN26");
    expect(screen.queryByText("Willow House")).not.toBeInTheDocument();
    expect(screen.queryByText("Dinner & toasts")).not.toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio", { name: "Joyfully attending" })) fireEvent.click(radio);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("DEMO RESPONSE SAVED")).toBeVisible();
  });

  it("resets only demo records and retains unrelated storage", () => {
    window.localStorage.setItem("existing-wedding-preference", "keep");
    window.localStorage.setItem(storageKey(demoInvitations[1]), "sample");
    render(<RsvpDemo />); open();
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, clear demo responses" }));
    expect(window.localStorage.getItem(storageKey(demoInvitations[1]))).toBeNull();
    expect(window.localStorage.getItem("existing-wedding-preference")).toBe("keep");
  });

  it("handles malformed storage and unavailable browser persistence without claiming a saved reply", () => {
    expect(readResponse(demoInvitations[0], "{broken")).toBeNull();
    window.localStorage.setItem(storageKey(demoInvitations[0]), JSON.stringify({ guests: [], note: "", savedAt: new Date().toISOString() }));
    render(<RsvpDemo />); open();
    expect(screen.getByText("Will you be joining us?")).toBeVisible();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Disabled"); });
    for (const radio of screen.getAllByRole("radio", { name: "Respectfully declining" })) fireEvent.click(radio);
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("DEMO RESPONSE PREVIEW")).toBeVisible();
    expect(screen.getByText(/browser couldn’t save/)).toBeVisible();
  });
});
