import { beforeEach, describe, expect, it } from "vitest";
import {
  checkSubmissionRateLimit,
  resetSubmissionRateLimit
} from "@/lib/submission-rate-limit";

describe("submission rate limit", () => {
  beforeEach(() => {
    resetSubmissionRateLimit();
  });

  it("allows four submissions per window and blocks the fifth", () => {
    const now = 1793900000000;

    expect(checkSubmissionRateLimit("karsen@example.com", now).allowed).toBe(true);
    expect(checkSubmissionRateLimit("karsen@example.com", now + 1).allowed).toBe(true);
    expect(checkSubmissionRateLimit("karsen@example.com", now + 2).allowed).toBe(true);
    expect(checkSubmissionRateLimit("karsen@example.com", now + 3).allowed).toBe(true);

    expect(checkSubmissionRateLimit("karsen@example.com", now + 4)).toEqual({
      allowed: false,
      retryAfterSeconds: 600
    });
  });

  it("resets once the window has passed", () => {
    const now = 1793900000000;

    for (let index = 0; index < 4; index += 1) {
      checkSubmissionRateLimit("karsen@example.com", now + index);
    }

    expect(checkSubmissionRateLimit("karsen@example.com", now + 10 * 60 * 1000).allowed).toBe(
      true
    );
  });
});
