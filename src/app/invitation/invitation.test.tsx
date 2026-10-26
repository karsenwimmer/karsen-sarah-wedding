import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Invitation } from "./invitation";
import { invitations, readReply, replyKey } from "./preview-data";
import { lookupInvitation, saveInvitationReply } from "./actions";

vi.mock("./actions", () => ({ lookupInvitation: vi.fn(), saveInvitationReply: vi.fn() }));
function open(code = "HARBOUR") {
  fireEvent.change(screen.getByLabelText("Your invitation code"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Open invitation" }));
}
beforeEach(() => { window.localStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.mocked(lookupInvitation).mockReset(); vi.mocked(saveInvitationReply).mockReset(); });

describe("Karsen and Sarah invitation", () => {
  it("rejects invalid codes, opens the selected household and puts RSVP before the combined details", () => {
    render(<Invitation />); open("not-real");
    expect(screen.getByRole("alert")).toHaveTextContent("isn’t part of this preview");
    open("har-bour ");
    expect(screen.getByRole("group", { name: /Avery Morgan/ })).toBeVisible();
    expect(screen.queryByText("Alex Parker")).not.toBeInTheDocument();
    expect(document.getElementById("your-rsvp")!.compareDocumentPosition(document.getElementById("the-day")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "The Boathouse" })).toHaveLength(1);
    expect(document.getElementById("dress-code")).toBeInTheDocument();
    expect(document.getElementById("transportation")).toBeInTheDocument();
    expect(screen.queryByText("THE LITTLE THINGS")).not.toBeInTheDocument();
  });
  it("collapses the entire form after a valid mixed response and remembers it after a reload", () => {
    window.localStorage.setItem("wedding-rsvp-demo:v1:ROSE24", "leave-alone");
    const view = render(<Invitation />); open();
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    fireEvent.click(within(screen.getByRole("group", { name: /Avery Morgan/ })).getByLabelText("Joyfully accepts"));
    fireEvent.click(within(screen.getByRole("group", { name: /Jordan Morgan/ })).getByLabelText("Regretfully declines"));
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("choose a meal");
    fireEvent.change(screen.getByLabelText(/Meal for Avery/), { target: { value: "fish" } });
    fireEvent.change(screen.getByLabelText(/Dietary requirements for Avery/), { target: { value: "No nuts" } });
    fireEvent.change(screen.getByLabelText(/A little note for us/), { target: { value: "See you there" } });
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByRole("heading", { name: "Your preview RSVP is saved." })).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText("We’ve saved")).not.toBeInTheDocument();
    view.unmount(); render(<Invitation />);
    expect(screen.getByRole("button", { name: "Edit your RSVP" })).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit your RSVP" }));
    expect(screen.getByLabelText(/Meal for Avery/)).toHaveValue("fish");
    expect(screen.getByLabelText(/Dietary requirements for Avery/)).toHaveValue("No nuts");
    expect(screen.getByLabelText(/A little note for us/)).toHaveValue("See you there");
    fireEvent.click(within(screen.getByRole("group", { name: /Avery Morgan/ })).getByLabelText("Regretfully declines"));
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(readReply(invitations[0], window.localStorage.getItem(replyKey(invitations[0])))?.answers[0]).toMatchObject({ attending: "no", meal: "", dietary: "" });
    expect(window.localStorage.getItem("wedding-rsvp-demo:v1:ROSE24")).toBe("leave-alone");
  });
  it("restores an unanswered preview expanded, while switching households does not leak answers", () => {
    const view = render(<Invitation />); open("FAMILY"); view.unmount(); render(<Invitation />);
    expect(screen.getByRole("group", { name: /Ellie Parker/ })).toBeVisible();
    fireEvent.click(within(screen.getByRole("group", { name: /Ellie Parker/ })).getByLabelText("Joyfully accepts"));
    fireEvent.click(within(screen.getByRole("group", { name: /Alex Parker/ })).getByLabelText("Joyfully accepts"));
    expect(within(screen.getByLabelText(/Meal for Ellie/)).getByRole("option", { name: "Children’s meal" })).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Meal for Alex/)).queryByRole("option", { name: "Children’s meal" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Change invitation/ })[0]); open();
    expect(screen.queryByText("Ellie Parker")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Avery Morgan/ })).toBeVisible();
  });
  it("keeps ceremony-only invitations free of reception events and meal choices", () => {
    render(<Invitation />); open("CHURCH");
    expect(screen.queryByText("The Boathouse")).not.toBeInTheDocument();
    expect(screen.queryByText("Between the celebrations")).not.toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio", { name: "Joyfully accepts" })) fireEvent.click(radio);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByRole("button", { name: "Edit your RSVP" })).toBeVisible();
  });
  it("leaves a failed save expanded and cancels edits back to the previously saved reply", () => {
    expect(readReply(invitations[0], "{broken")).toBeNull();
    render(<Invitation />); open("CHURCH");
    for (const radio of screen.getAllByRole("radio", { name: "Regretfully declines" })) fireEvent.click(radio);
    const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("browser couldn’t save");
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    fail.mockRestore(); fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    fireEvent.click(screen.getByRole("button", { name: "Edit your RSVP" }));
    fireEvent.click(screen.getAllByRole("radio", { name: "Joyfully accepts" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Keep my saved reply" }));
    expect(screen.getByText("0 attending · 2 declining")).toBeVisible();
  });
  it("loads a real invitation’s saved reply from the server without caching its code or answers locally", async () => {
    const invite = { ...invitations[2], code: "PRIVATE123", mealsOpen: false };
    const reply = { answers: invite.guests.map(g => ({ id: g.id, attending: "no" as const, meal: "", dietary: "" })), note: "", savedAt: new Date().toISOString() };
    vi.mocked(lookupInvitation).mockResolvedValue({ ok: true, invite, reply });
    render(<Invitation />); open("PRIVATE123");
    expect(await screen.findByRole("heading", { name: "Your RSVP is saved." })).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Edit your RSVP" }));
    vi.mocked(saveInvitationReply).mockResolvedValue({ ok: false, message: "Try again shortly." });
    fireEvent.click(screen.getByRole("button", { name: /Send RSVP/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Try again shortly."));
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});
