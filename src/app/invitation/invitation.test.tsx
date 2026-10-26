import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Invitation } from "./invitation";
import { invitations, readReply, replyKey } from "./preview-data";

function open(code = "HARBOUR") {
  fireEvent.change(screen.getByLabelText("Your invitation code"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Open invitation" }));
}
beforeEach(() => { window.localStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Karsen and Sarah invitation preview", () => {
  it("rejects invalid codes and opens a normalized household without other guest names", () => {
    render(<Invitation />); open("not-real");
    expect(screen.getByRole("alert")).toHaveTextContent("isn’t part of this preview");
    open("har-bour ");
    expect(screen.getByRole("group", { name: /Avery Morgan/ })).toBeVisible();
    expect(screen.queryByText("Alex Parker")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The Boathouse" })).toBeVisible();
  });
  it("validates individual replies, saves mixed attendance, reopens and clears declined meal details", () => {
    window.localStorage.setItem("wedding-rsvp-demo:v1:ROSE24", "leave-alone");
    const view = render(<Invitation />); open();
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    const avery = screen.getByRole("group", { name: /Avery Morgan/ });
    const jordan = screen.getByRole("group", { name: /Jordan Morgan/ });
    fireEvent.click(within(avery).getByLabelText("Joyfully accepts"));
    fireEvent.click(within(jordan).getByLabelText("Regretfully declines"));
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("choose a meal");
    fireEvent.change(screen.getByLabelText(/Meal for Avery/), { target: { value: "fish" } });
    fireEvent.change(screen.getByLabelText(/Dietary requirements for Avery/), { target: { value: "No nuts" } });
    fireEvent.change(screen.getByLabelText(/A little note for us/), { target: { value: "See you there" } });
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByText("PREVIEW REPLY SAVED")).toBeVisible();
    expect(screen.getByText("Attending · Fish")).toBeVisible();
    expect(screen.getByText("Dietary requirements: No nuts")).toBeVisible();
    view.unmount(); render(<Invitation />); open();
    fireEvent.click(screen.getByRole("button", { name: "Edit my reply" }));
    expect(screen.getByLabelText(/Meal for Avery/)).toHaveValue("fish");
    fireEvent.click(within(screen.getByRole("group", { name: /Avery Morgan/ })).getByLabelText("Regretfully declines"));
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    const reply = readReply(invitations[0], window.localStorage.getItem(replyKey(invitations[0])));
    expect(reply?.answers[0]).toMatchObject({ attending: "no", meal: "", dietary: "" });
    expect(window.localStorage.getItem("wedding-rsvp-demo:v1:ROSE24")).toBe("leave-alone");
  });
  it("hides reception content and meal questions for church invitations", () => {
    render(<Invitation />); open("CHURCH");
    expect(screen.queryByText("The Boathouse")).not.toBeInTheDocument();
    expect(screen.queryByText("By the harbour.")).not.toBeInTheDocument();
    expect(screen.queryByText("A seat at our table")).not.toBeInTheDocument();
    expect(screen.queryByText(/WEDDING QUIZ/)).not.toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio", { name: "Joyfully accepts" })) fireEvent.click(radio);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByText("PREVIEW REPLY SAVED")).toBeVisible();
  });
  it("allows children’s meals only for children and does not expose another invitation’s saved response", () => {
    render(<Invitation />); open("FAMILY");
    fireEvent.click(within(screen.getByRole("group", { name: /Ellie Parker/ })).getByLabelText("Joyfully accepts"));
    fireEvent.click(within(screen.getByRole("group", { name: /Alex Parker/ })).getByLabelText("Joyfully accepts"));
    expect(within(screen.getByLabelText(/Meal for Ellie/)).getByRole("option", { name: "Children’s meal" })).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Meal for Alex/)).queryByRole("option", { name: "Children’s meal" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Change invitation/ })[0]); open();
    expect(screen.queryByText("Ellie Parker")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Avery Morgan/ })).toBeVisible();
  });
  it("handles corrupt or unavailable storage without claiming a saved response", () => {
    expect(readReply(invitations[0], "{broken")).toBeNull();
    expect(readReply(invitations[0], JSON.stringify({ answers: [], note: "", savedAt: "invalid" }))).toBeNull();
    window.localStorage.setItem(replyKey(invitations[0]), "{broken");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    render(<Invitation />); open();
    for (const radio of screen.getAllByRole("radio", { name: "Regretfully declines" })) fireEvent.click(radio);
    fireEvent.click(screen.getByRole("button", { name: /Save preview reply/ }));
    expect(screen.getByText(/browser couldn’t save/)).toBeVisible();
    expect(screen.queryByText("PREVIEW REPLY SAVED")).not.toBeInTheDocument();
  });
});
