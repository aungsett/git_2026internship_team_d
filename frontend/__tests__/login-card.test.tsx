// Component tests for the shared LoginCard component.
// These focus on the critical behaviours: calling the right API helper,
// storing auth data, redirecting by role, and surfacing errors.

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import LoginCard from "@/components/LoginCard";
import type * as ApisModule from "@/app/lib/apis";

// Capture router.push so we can assert on navigation targets.
const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock API helpers to avoid real network and to control outcomes.
jest.mock("@/app/lib/apis", () => {
  const actual = jest.requireActual("@/app/lib/apis");
  return {
    ...actual,
    userLoginRequest: jest.fn(),
    adminLoginRequest: jest.fn(),
  };
});

const mockedApis = jest.requireMock("@/app/lib/apis") as jest.Mocked<
  typeof ApisModule
>;

function renderLoginCard(loginType: "user" | "admin") {
  return render(
    <LoginCard
      loginType={loginType}
      title={loginType === "admin" ? "Admin Login" : "User Login"}
      subtitle="Welcome back"
      emailLabel="Email"
      emailPlaceholder="you@example.com"
      buttonText="Sign in"
      switchText="Switch"
      switchHref="/"
    />
  );
}

describe("LoginCard", () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockedApis.userLoginRequest.mockReset();
    mockedApis.adminLoginRequest.mockReset();
    // Provide a basic in-memory localStorage for the tests.
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      length: 0,
    };
  });

  it("logs in a user and redirects to /dashboard", async () => {
    mockedApis.userLoginRequest.mockResolvedValueOnce({
      token: "user-token",
      role: "user",
    });

    renderLoginCard("user");

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "pw" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedApis.userLoginRequest).toHaveBeenCalledWith(
        "user@test.com",
        "pw"
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("logs in an admin and redirects to /admin-login/dashboard", async () => {
    mockedApis.adminLoginRequest.mockResolvedValueOnce({
      token: "admin-token",
      role: "admin",
    });

    renderLoginCard("admin");

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "admin@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "pw" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedApis.adminLoginRequest).toHaveBeenCalledWith(
        "admin@test.com",
        "pw"
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/admin-login/dashboard");
  });

  it("shows an error when the login helper rejects", async () => {
    mockedApis.userLoginRequest.mockRejectedValueOnce(
      new Error("Invalid credentials")
    );

    renderLoginCard("user");

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "pw" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText("Invalid credentials");
  });
});