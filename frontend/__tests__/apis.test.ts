// High-level tests for the frontend API helpers that talk to Next/ATS backend.
import { LoginApiError, adminLoginRequest } from "@/app/lib/apis";

describe("frontend api helpers", () => {
  beforeEach(() => {
    // Stub `fetch` globally for each test so we can control responses.
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("adminLoginRequest returns token+role on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: "t123", role: "admin" }),
    });

    await expect(adminLoginRequest("a@b.com", "pw")).resolves.toEqual({
      token: "t123",
      role: "admin",
    });
  });

  it("adminLoginRequest throws LoginApiError on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Invalid credentials",
        redirectTo: "/admin-login",
        actionText: "Try again",
      }),
    });

    await expect(adminLoginRequest("a@b.com", "pw")).rejects.toBeInstanceOf(
      LoginApiError
    );
  });
});

