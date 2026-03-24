// Component-level test for the admin applicant detail page.
// This behaves like a small integration test: we render the real page component and mock
// only Next.js navigation + API helpers so that UI behaviour can be asserted end‑to‑end.
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ApplicantDetailPage from "@/app/admin-login/dashboard/applicants/[id]/page";
import type * as ApisModule from "@/app/lib/apis";

// Allow assertions on where unauthenticated users are redirected.
const replaceMock = jest.fn();

// Mock Next navigation hooks so the page thinks it's on `/admin-login/dashboard/applicants/123`.
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ replace: replaceMock }),
}));

// Mock API client so we don't hit the real backend; we control the applicant data and mutations.
jest.mock("@/app/lib/apis", () => {
  const actual = jest.requireActual("@/app/lib/apis");
  return {
    ...actual,
    getToken: jest.fn(() => "token"),
    getAdminApplicationById: jest.fn(async () => ({
      application_id: 123,
      applicant_id: 1,
      status: "New",
      applied_on: "2026-03-14T10:00:00.000Z",
      full_name: "Jane Doe",
      email: "jane@test.com",
      phone_number: "123",
      highest_degree: "BSc",
      years_experience: 1,
      course_name: "Engineering",
      course_level: "Beginner",
      location: "X",
      date_of_birth: null,
      field_of_study: "CS",
      university: "Uni",
      graduation_year: 2024,
      gpa_percentage: "90",
      current_job_title: null,
      company_name: null,
      industry: null,
      professional_summary: null,
      file_name: "cv.pdf",
      course_schedule: null,
    })),
    updateApplicationStatus: jest.fn(async () => {}),
    downloadAdminCv: jest.fn(async () => new Blob(["cv"])),
  };
});

// Convenience accessor for mocked API helpers inside individual tests.
const mockedApis = jest.requireMock("@/app/lib/apis") as jest.Mocked<
  typeof ApisModule
>;

describe("Applicant detail page", () => {
  it("dims non-selected statuses and shows toast on change", async () => {
    // Arrange: render the page with our mocks wired up.
    const user = userEvent.setup();
    render(<ApplicantDetailPage />);

    // Wait for initial applicant data to load and header to render.
    await screen.findByRole("heading", { name: "Jane Doe" });

    // Narrow our queries to the "Update Status" card so we don't accidentally
    // match similar text elsewhere on the page.
    const updateStatusCard = screen
      .getByRole("heading", { name: "Update Status" })
      .closest("div");
    expect(updateStatusCard).not.toBeNull();

    const scope = within(updateStatusCard as HTMLElement);
    const selected = scope.getByText("New");
    const nonSelected = scope.getByText("Under Review");

    // The currently selected status is visually highlighted; others are dimmed.
    expect(selected.className).toContain("shadow");
    expect(nonSelected.className).toContain("opacity-60");

    // Act: click a different status option.
    await user.click(nonSelected);

    // Assert: a success toast appears with the new status text.
    await waitFor(() => {
      expect(
        screen.getByText(/Status updated to "Under Review"/)
      ).toBeInTheDocument();
    });
  });

  it("redirects to admin login when there is no token", () => {
    // Make the token helper behave as if the user is logged out.
    mockedApis.getToken.mockReturnValueOnce(null);

    render(<ApplicantDetailPage />);

    expect(replaceMock).toHaveBeenCalledWith("/admin-login");
  });

  it("shows an error message when the initial load fails", async () => {
    // Simulate API failure for the initial applicant fetch.
    mockedApis.getAdminApplicationById.mockRejectedValueOnce(
      new Error("Failed to load")
    );

    render(<ApplicantDetailPage />);

    await screen.findByText("Failed to load");
  });

  it("opens CV preview in a new tab", async () => {
    const user = userEvent.setup();
    const openSpy = jest
      .spyOn(window, "open")
      .mockReturnValue({} as Window);
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:preview-url");
    URL.revokeObjectURL = jest.fn();

    render(<ApplicantDetailPage />);
    await screen.findByRole("heading", { name: "Jane Doe" });

    const previewBtn = screen.getByRole("button", { name: /preview/i });
    await user.click(previewBtn);

    expect(mockedApis.downloadAdminCv).toHaveBeenCalledWith("123");
    expect(openSpy).toHaveBeenCalledWith(
      "blob:preview-url",
      "_blank",
      "noopener,noreferrer"
    );

    openSpy.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
});

