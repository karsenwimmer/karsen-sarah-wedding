import { afterEach, describe, expect, it, vi } from "vitest";

const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock
}));

import { keepSupabaseActive } from "@/lib/supabase-keepalive";

describe("Supabase keepalive", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("performs a minimal read without writing data", async () => {
    const limit = vi.fn().mockResolvedValue({ error: null });
    const select = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ select });
    createSupabaseAdminClientMock.mockReturnValue({ from });

    await keepSupabaseActive();

    expect(from).toHaveBeenCalledWith("households");
    expect(select).toHaveBeenCalledWith("id");
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("reports database errors", async () => {
    const limit = vi.fn().mockResolvedValue({ error: { message: "Project paused" } });
    const select = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ select });
    createSupabaseAdminClientMock.mockReturnValue({ from });

    await expect(keepSupabaseActive()).rejects.toThrow("Project paused");
  });
});
