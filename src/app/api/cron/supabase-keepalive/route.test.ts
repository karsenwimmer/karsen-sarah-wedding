import { afterEach, describe, expect, it, vi } from "vitest";

const keepSupabaseActiveMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase-keepalive", () => ({
  keepSupabaseActive: keepSupabaseActiveMock
}));

import { GET } from "@/app/api/cron/supabase-keepalive/route";

function request(authorization?: string) {
  return new Request("https://thewimmers.ca/api/cron/supabase-keepalive", {
    headers: authorization ? { authorization } : undefined
  });
}

describe("Supabase keepalive cron route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects requests when the cron secret is not configured", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(keepSupabaseActiveMock).not.toHaveBeenCalled();
  });

  it("rejects requests with the wrong authorization", async () => {
    vi.stubEnv("CRON_SECRET", "correct-secret");

    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(keepSupabaseActiveMock).not.toHaveBeenCalled();
  });

  it("performs the keepalive for an authorized Vercel request", async () => {
    vi.stubEnv("CRON_SECRET", "correct-secret");

    const response = await GET(request("Bearer correct-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(keepSupabaseActiveMock).toHaveBeenCalledOnce();
  });

  it("returns a service error when Supabase cannot be reached", async () => {
    vi.stubEnv("CRON_SECRET", "correct-secret");
    keepSupabaseActiveMock.mockRejectedValueOnce(new Error("Project unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(request("Bearer correct-secret"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false });
    expect(consoleError).toHaveBeenCalledWith("Supabase keepalive failed.", {
      errorMessage: "Project unavailable"
    });
  });
});
