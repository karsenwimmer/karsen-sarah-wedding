import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Invitation } from "./invitation";
import { invitations, readReply, replyKey } from "./preview-data";
import { lookupInvitation, saveInvitationReply } from "./actions";

vi.mock("./actions", () => ({ lookupInvitation: vi.fn(), saveInvitationReply: vi.fn() }));
function enterCode(code = "HARBOUR") {
  fireEvent.change(screen.getByLabelText("Enter the Code"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Unlock invitation" }));
}
async function open(code = "HARBOUR") {
  enterCode(code);
  await waitFor(() => expect(screen.queryByLabelText("Enter the Code")).not.toBeInTheDocument());
}
beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); Reflect.deleteProperty(Element.prototype, "scrollIntoView"); vi.restoreAllMocks(); vi.mocked(lookupInvitation).mockReset(); vi.mocked(saveInvitationReply).mockReset(); });

describe("Karsen and Sarah invitation", () => {
  it("opens the lock before revealing the page, then scrolls and focuses the RSVP section", async () => {
    vi.useFakeTimers();
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList);
    render(<Invitation />);
    enterCode();
    expect(screen.getByRole("button", { name: "Invitation unlocked" })).toBeDisabled();
    expect(screen.getByText("Your invitation is unlocked.")).toBeVisible();
    expect(document.getElementById("your-rsvp")).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(document.getElementById("your-rsvp")).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(17); });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("heading", { name: "Will you be joining us?" })).toHaveFocus();
  });
  it("skips the motion for reduced-motion guests and keeps rejected codes locked", async () => {
    vi.mocked(lookupInvitation).mockResolvedValue({ ok: false, message: "Please check your code." });
    render(<Invitation />);
    enterCode("PRIVATE123");
    expect(await screen.findByRole("alert")).toHaveTextContent("Please check your code.");
    expect(screen.getByRole("button", { name: "Unlock invitation" })).not.toHaveAttribute("data-unlocked");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    await open();
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" }));
  });
  it("shows the RSVP heading, scripted date and countdown before code entry, with details locked", async () => {
    // Older trial visits remembered a sample code. It must no longer bypass entry.
    window.localStorage.setItem("ks-invitation-preview:active", "HARBOUR");
    render(<Invitation />);
    expect(screen.getByText("RSVP", { exact: true })).toBeVisible();
    expect(screen.queryByText("TOGETHER WITH OUR FAMILIES")).not.toBeInTheDocument();
    expect(screen.getByText("07 - 17 - 27")).toBeVisible();
    const countdown = screen.getByLabelText("Countdown to July 17, 2027");
    const code = screen.getByLabelText("Enter the Code");
    expect(countdown.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.getElementById("the-day")).not.toBeInTheDocument();
    expect(document.getElementById("your-rsvp")).not.toBeInTheDocument();
    expect(screen.queryByText("WITH LOVE, ALWAYS.")).not.toBeInTheDocument();
  });
  it("highlights code entry for wheel, keyboard and touch scrolling, and clears it when typing", async () => {
    render(<Invitation />);
    const input = screen.getByLabelText("Enter the Code");
    const gate = input.closest("form")!;
    expect(fireEvent.wheel(window, { deltaY: 220 })).toBe(true);
    expect(gate).toHaveAttribute("data-highlighted", "true");
    expect(screen.getByText("Enter your code to explore the rest of the page.")).toBeVisible();
    fireEvent.change(input, { target: { value: "H" } });
    expect(gate).not.toHaveAttribute("data-highlighted");
    fireEvent.keyDown(input, { key: " " });
    expect(gate).not.toHaveAttribute("data-highlighted");
    fireEvent.keyDown(window, { key: "PageDown" });
    expect(gate).toHaveAttribute("data-highlighted", "true");
    fireEvent.change(input, { target: { value: "HA" } });
    fireEvent.touchStart(window, { touches: [{ clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientY: 220 }] });
    expect(gate).toHaveAttribute("data-highlighted", "true");
    await open();
    expect(document.getElementById("the-day")).toBeInTheDocument();
    expect(screen.queryByLabelText("Enter the Code")).not.toBeInTheDocument();
  });

  it("rejects invalid codes, opens the selected household and puts RSVP before the combined details", async () => {
    render(<Invitation />); enterCode("not-real");
    expect(screen.getByRole("alert")).toHaveTextContent("isn’t part of this preview");
    await open("har-bour ");
    expect(screen.getByRole("heading", { name: "Avery and Jordan, we’ve saved a place for you." })).toBeVisible();
    expect(screen.getByText("Please make your decisions and choices for each guest here.")).toBeVisible();
    expect(screen.queryByText("An invitation for")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Avery Morgan/ })).toBeVisible();
    expect(screen.queryByText("Alex Parker")).not.toBeInTheDocument();
    expect(document.getElementById("your-rsvp")!.compareDocumentPosition(document.getElementById("the-day")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "The Boathouse" })).toHaveLength(1);
    expect(document.getElementById("dress-code")).toBeInTheDocument();
    expect(document.getElementById("transportation")).toBeInTheDocument();
    expect(screen.queryByText("THE LITTLE THINGS")).not.toBeInTheDocument();
  });
  it("collapses the entire form after a valid mixed response and remembers it after a reload", async () => {
    window.localStorage.setItem("wedding-rsvp-demo:v1:ROSE24", "leave-alone");
    const view = render(<Invitation />); await open();
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
    expect(screen.getByLabelText("Enter the Code")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Edit your RSVP" })).not.toBeInTheDocument();
    await open();
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
  it("restores an unanswered preview expanded, while switching households does not leak answers", async () => {
    const view = render(<Invitation />); await open("FAMILY"); view.unmount(); render(<Invitation />);
    expect(screen.getByLabelText("Enter the Code")).toBeVisible();
    await open("FAMILY");
    expect(screen.getByRole("heading", { name: "The Parker Family, we’ve saved a place for you." })).toBeVisible();
    expect(screen.getByRole("group", { name: /Ellie Parker/ })).toBeVisible();
    fireEvent.click(within(screen.getByRole("group", { name: /Ellie Parker/ })).getByLabelText("Joyfully accepts"));
    fireEvent.click(within(screen.getByRole("group", { name: /Alex Parker/ })).getByLabelText("Joyfully accepts"));
    expect(within(screen.getByLabelText(/Meal for Ellie/)).getByRole("option", { name: "Children’s meal" })).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Meal for Alex/)).queryByRole("option", { name: "Children’s meal" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Change invitation/ })[0]); await open();
    expect(screen.queryByText("Ellie Parker")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Avery Morgan/ })).toBeVisible();
  });
  it("keeps ceremony-only invitations free of reception events and meal choices", async () => {
    render(<Invitation />); await open("CHURCH");
    expect(screen.queryByText("The Boathouse")).not.toBeInTheDocument();
    expect(screen.queryByText("Between the celebrations")).not.toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio", { name: "Joyfully accepts" })) fireEvent.click(radio);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByRole("button", { name: "Edit your RSVP" })).toBeVisible();
  });
  it("leaves a failed save expanded and cancels edits back to the previously saved reply", async () => {
    expect(readReply(invitations[0], "{broken")).toBeNull();
    render(<Invitation />); await open("CHURCH");
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
    render(<Invitation />); await open("PRIVATE123");
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
