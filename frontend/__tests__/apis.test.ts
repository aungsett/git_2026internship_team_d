// High-level tests for the frontend API helpers that talk to the Next.js API routes / ATS backend.
// These are pure unit tests: we stub `fetch` and never hit the real network.
import {
  LoginApiError,
  adminLoginRequest,
  userLoginRequest,
  registerRequest,
} from "@/app/lib/apis";

describe("frontend api helpers", () => {
  beforeEach(() => {
    // Stub `fetch` globally for each test so we can control responses for each scenario.
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Clean up mocks between tests so state doesn't leak.
    jest.resetAllMocks();
  });

  it("adminLoginRequest returns token+role on success", async () => {
    // Arrange: mock a successful HTTP response with the JSON shape that the helper expects.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: "t123", role: "admin" }),
    });

    // Act + Assert: the promise should resolve with the parsed token and role.
    await expect(adminLoginRequest("a@b.com", "pw")).resolves.toEqual({
      token: "t123",
      role: "admin",
    });
  });

  it("adminLoginRequest throws LoginApiError on failure", async () => {
    // Arrange: backend responds with a non-OK status and an error payload.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Invalid credentials",
        redirectTo: "/admin-login",
        actionText: "Try again",
      }),
    });

    // Act + Assert: the promise should reject with our custom error type, so callers
    // can read message / redirectTo / actionText in the UI.
    await expect(adminLoginRequest("a@b.com", "pw")).rejects.toBeInstanceOf(
      LoginApiError
    );
  });

  it("userLoginRequest hits the user login path and returns token+role", async () => {
    // Arrange: successful login for a regular user.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: "user-token", role: "user" }),
    });

    const result = await userLoginRequest("user@test.com", "pw");

    // Assert: correct shape and underlying fetch call.
    expect(result).toEqual({ token: "user-token", role: "user" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login/user",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("userLoginRequest throws LoginApiError with message from backend on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Account locked",
        redirectTo: "/login",
        actionText: "Contact support",
      }),
    });

    await expect(userLoginRequest("user@test.com", "pw")).rejects.toEqual(
      expect.objectContaining({
        name: "LoginApiError",
        message: "Account locked",
        redirectTo: "/login",
        actionText: "Contact support",
      })
    );
  });

  it("registerRequest throws a generic error when backend does not send error field", async () => {
    // Arrange: backend fails without a specific error message.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    // Act + Assert: we fall back to the default message.
    await expect(
      registerRequest("Jane", "jane@test.com", "pw")
    ).rejects.toThrow("Registration failed");
  });
});

