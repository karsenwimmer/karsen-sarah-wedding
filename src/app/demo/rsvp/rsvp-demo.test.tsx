import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RsvpDemo } from "./rsvp-demo";
import { demoInvitations, readResponse, storageKey } from "./demo-data";

function open(code = "ROSE24") {
  fireEvent.change(screen.getByRole("textbox", { name: "Enter your code" }), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: /Open my invitation/ }));
}

beforeEach(() => { window.localStorage.clear(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("isolated wedding RSVP demo", () => {
  it("shows the confirmed date without locations on entry and reveals the ceremony only after opening", () => {
    render(<RsvpDemo />);
    const hero = screen.getByRole("heading", { level: 1 });
    const portrait = screen.getByRole("img", { name: /Victoria and Luca holding hands/ });
    expect(screen.getByText("August 28, 2027")).toBeVisible();
    expect(screen.queryByText(/Mississauga|Central Parkway|Saints Peter and Paul|Venetian|Romina|5:30/)).not.toBeInTheDocument();
    open();
    expect(screen.getByRole("heading", { level: 1 })).toBe(hero);
    expect(screen.getByRole("img", { name: /Victoria and Luca holding hands/ })).toBe(portrait);
    expect(screen.queryByRole("textbox", { name: "Enter your code" })).not.toBeInTheDocument();
    const welcome = screen.getByRole("heading", { name: "Jordan & Taylor" });
    const instructions = screen.getByRole("heading", { name: "Will you be joining us?" });
    const response = screen.getByRole("heading", { name: "Your response" });
    const details = screen.getByRole("heading", { name: "Locations" });
    expect(welcome.compareDocumentPosition(instructions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(instructions.compareDocumentPosition(response) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const name of ["Locations", "Itinerary", "Dress code", "FAQs"]) {
      expect(screen.getByRole("region", { name })).toBeVisible();
    }
    expect(screen.queryByText(/We’d love to celebrate|We can’t wait to share|Explore the wedding details|Please reply for each person/)).not.toBeInTheDocument();
    expect(response.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Saints Peter and Paul Parish" })).toBeVisible();
    expect(screen.getByText("4070 Central Parkway East, Mississauga, Ontario L4Z 1T6")).toBeVisible();
    expect(screen.getByText("Ceremony at 12:00 PM")).toBeVisible();
    expect(screen.getByRole("heading", { name: "The Venetian Banquet Hall" })).toBeVisible();
    expect(screen.getByText("219 Romina Drive, Concord, Ontario L4K 4V3")).toBeVisible();
    expect(screen.getByText("Reception at 5:30 PM")).toBeVisible();
    expect(screen.getByText("Reception & antipasto bar")).toBeVisible();
    expect(screen.queryByText(/Oakville|Willow House|May 12, 2026|June 12, 2026/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change invitation" }));
    expect(screen.queryByText(/Mississauga|Central Parkway|Saints Peter and Paul|Venetian|Romina|5:30/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your response" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Enter your code" })).toHaveValue("");
    expect(screen.getByRole("heading", { level: 1 })).toBe(hero);
  });

  it("lands above the welcome opening and skips animation for reduced motion", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frames.push(callback); return frames.length; });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const view = render(<RsvpDemo />);
    open();
    const region = screen.getByRole("region", { name: "Jordan & Taylor" });
    vi.spyOn(region, "getBoundingClientRect").mockReturnValue({ top: 900 } as DOMRect);
    frames.shift()!(0);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 868, behavior: "instant" });
    expect(screen.getByRole("heading", { name: "Jordan & Taylor" })).toHaveFocus();
    expect(frames).toHaveLength(0);
    view.unmount();
    vi.unstubAllGlobals();
  });

  it("keeps details visible and cancels their reveals when reduced motion is enabled", () => {
    let callback: IntersectionObserverCallback = () => {};
    let preferenceChanged = () => {};
    let reduce = false;
    const observe = vi.fn();
    const disconnect = vi.fn();
    const cancel = vi.fn();
    const animate = vi.fn((...args: Parameters<Element["animate"]>) => {
      void args;
      return { finished: new Promise(() => {}), cancel };
    });
    const previousAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      get matches() { return reduce; },
      addEventListener: (_event: string, listener: () => void) => { preferenceChanged = listener; },
      removeEventListener: vi.fn()
    })));
    vi.stubGlobal("IntersectionObserver", class {
      constructor(listener: IntersectionObserverCallback) { callback = listener; }
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-detail-heading") ? new DOMRect(0, 2000, 500, 60) : new DOMRect();
    });
    try {
      const view = render(<RsvpDemo />); open();
      expect(observe.mock.calls.filter(([element]) => element.hasAttribute("data-detail-heading"))).toHaveLength(4);
      const title = screen.getByRole("heading", { name: "Locations" });
      const rect = title.parentElement!.getBoundingClientRect();
      expect(title.parentElement).toHaveAttribute("data-reveal-pending");
      act(() => callback([{ isIntersecting: true, target: title.parentElement!, boundingClientRect: rect, intersectionRatio: .1, intersectionRect: rect, rootBounds: null, time: 0 }], {} as IntersectionObserver));
      expect(animate).not.toHaveBeenCalled();
      expect(title.parentElement).toHaveAttribute("data-reveal-pending");
      act(() => callback([{ isIntersecting: true, target: title.parentElement!, boundingClientRect: rect, intersectionRatio: 1, intersectionRect: rect, rootBounds: null, time: 0 }], {} as IntersectionObserver));
      expect(animate).toHaveBeenCalledTimes(1);
      expect(title.parentElement).not.toHaveAttribute("data-reveal-pending");
      expect(title).toBeVisible();
      const name = screen.getByRole("heading", { name: "Jordan & Taylor" });
      const nameRect = name.getBoundingClientRect();
      const nameEntry = { isIntersecting: true, target: name, boundingClientRect: nameRect, intersectionRatio: 1, intersectionRect: nameRect, rootBounds: null, time: 0 };
      act(() => callback([nameEntry], {} as IntersectionObserver));
      expect(animate).toHaveBeenCalledTimes(2);
      const titleTiming = animate.mock.calls[0][1] as KeyframeAnimationOptions;
      const nameTiming = animate.mock.calls[1][1] as KeyframeAnimationOptions;
      expect(nameTiming.duration).toBeGreaterThan(titleTiming.duration as number);
      act(() => callback([nameEntry], {} as IntersectionObserver));
      expect(animate).toHaveBeenCalledTimes(2);
      const waiting = screen.getByRole("heading", { name: "Itinerary" }).parentElement;
      expect(waiting).toHaveAttribute("data-reveal-pending");
      act(() => { reduce = true; preferenceChanged(); });
      expect(cancel).toHaveBeenCalledTimes(2);
      expect(disconnect).toHaveBeenCalled();
      expect(waiting).not.toHaveAttribute("data-reveal-pending");
      expect(title).toBeVisible();
      expect(name).toBeVisible();
      view.unmount();
    } finally {
      if (previousAnimate) Object.defineProperty(Element.prototype, "animate", previousAnimate);
      else Reflect.deleteProperty(Element.prototype, "animate");
    }
  });

  it("rejects unknown codes and opens only the selected household with a normalized code", () => {
    render(<RsvpDemo />);
    open("INVALID");
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t find");
    open(" rose-24 ");
    expect(screen.getByText("Jordan Morgan")).toBeVisible();
    expect(screen.queryByText("Sam Bennett")).not.toBeInTheDocument();
  });

  it("validates attendance, saves optional dietary notes, reloads them and supports editing", () => {
    const view = render(<RsvpDemo />);
    open();
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    const jordan = screen.getByRole("group", { name: /Jordan Morgan/ });
    const taylor = screen.getByRole("group", { name: /Taylor Morgan/ });
    fireEvent.click(within(jordan).getByLabelText("Joyfully attending"));
    fireEvent.click(within(taylor).getByLabelText("Respectfully declining"));
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Dietary requirements or allergies for Jordan/), { target: { value: "  No nuts  " } });
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("DEMO RESPONSE SAVED")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Victoria Pacheco");
    expect(screen.getByText("Dietary requirements: No nuts")).toBeVisible();
    expect(window.localStorage.getItem(storageKey(demoInvitations[0]))).toContain('"attendance":"no"');
    view.unmount();
    render(<RsvpDemo />); open();
    fireEvent.click(screen.getByRole("button", { name: /Edit my response/ }));
    expect(screen.getByLabelText(/Dietary requirements or allergies for Jordan/)).toHaveValue("No nuts");
    fireEvent.click(within(screen.getByRole("group", { name: /Jordan Morgan/ })).getByLabelText("Respectfully declining"));
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("Thank you for letting us know.")).toBeVisible();
    const saved = JSON.parse(window.localStorage.getItem(storageKey(demoInvitations[0]))!);
    expect(saved.guests[0]).toMatchObject({ dietary: "", attendance: "no" });
    expect(saved.guests[0]).not.toHaveProperty("meal");
  });

  it("assumes the standard menu for blank dietary fields and keeps ceremony-only invitations free of reception details", () => {
    render(<RsvpDemo />); open("OAK123");
    for (const radio of screen.getAllByRole("radio", { name: "Joyfully attending" })) fireEvent.click(radio);
    expect(screen.getByLabelText(/Dietary requirements or allergies for Avery/)).toHaveValue("");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getAllByText("Standard menu · No dietary requirements provided")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /Try another code/ }));
    open("FERN26");
    expect(screen.queryByRole("heading", { name: "The Venetian Banquet Hall" })).not.toBeInTheDocument();
    expect(screen.queryByText(/antipasto|Romina|5:30|chicken and beef/)).not.toBeInTheDocument();
    for (const radio of screen.getAllByRole("radio", { name: "Joyfully attending" })) fireEvent.click(radio);
    expect(screen.queryByLabelText(/Dietary requirements or allergies/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Save demo RSVP/ }));
    expect(screen.getByText("DEMO RESPONSE SAVED")).toBeVisible();
    expect(screen.queryByText(/Standard menu/)).not.toBeInTheDocument();
  });

  it("keeps alternative requests from earlier saved demo responses", () => {
    const raw = JSON.stringify({ guests: [
      { guestId: "jordan", attendance: "yes", meal: "vegetarian", dietary: "" },
      { guestId: "taylor", attendance: "yes", meal: "salmon", dietary: "" }
    ], note: "See you there", savedAt: new Date().toISOString() });
    const saved = readResponse(demoInvitations[0], raw);
    expect(saved?.guests.map((guest) => guest.dietary)).toEqual([
      "Vegetarian meal requested previously", "Fish meal requested previously"
    ]);
    expect(saved?.guests[0]).not.toHaveProperty("meal");
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
