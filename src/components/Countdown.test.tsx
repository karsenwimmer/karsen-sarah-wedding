import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Countdown } from "./Countdown";

afterEach(() => { cleanup(); vi.useRealTimers(); });

it("allows the invitation's ceremony target while preserving the save-the-date default", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2027-07-17T16:00:00Z"));
  const view = render(<Countdown target="2027-07-17T13:00:00-04:00" />);
  const hours = screen.getByText("Hours").previousElementSibling;
  expect(hours).toHaveTextContent("01");
  view.unmount();
  render(<Countdown />);
  expect(screen.getByText("Today is the day.")).toBeVisible();
});
