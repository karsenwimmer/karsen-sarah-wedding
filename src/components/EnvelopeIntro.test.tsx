import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { EnvelopeIntro } from "@/components/EnvelopeIntro";

describe("EnvelopeIntro", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("opens the envelope and records the session preference", async () => {
    render(
      <>
        <main id="main-content" tabIndex={-1} />
        <EnvelopeIntro />
      </>
    );

    const openButton = await screen.findByRole("button", { name: "Open the envelope" });

    fireEvent.click(openButton);

    await waitFor(
      () => expect(window.sessionStorage.getItem("ks-envelope-intro-played")).toBe("true"),
      { timeout: 7000 }
    );
    await waitFor(() => expect(document.getElementById("main-content")).toHaveFocus());
  }, 7500);
});
