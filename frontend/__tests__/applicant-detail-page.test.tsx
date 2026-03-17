// Component-level test for the admin applicant detail page.
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ApplicantDetailPage from "@/app/admin-login/dashboard/applicants/[id]/page";

// Mock Next navigation hooks so the page thinks it's on `/admin-login/dashboard/applicants/123`.
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ replace: jest.fn() }),
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

describe("Applicant detail page", () => {
  it("dims non-selected statuses and shows toast on change", async () => {
    const user = userEvent.setup();
    render(<ApplicantDetailPage />);

    // Wait for initial applicant data to load and header to render.
    await screen.findByRole("heading", { name: "Jane Doe" });

    const updateStatusCard = screen
      .getByRole("heading", { name: "Update Status" })
      .closest("div");
    expect(updateStatusCard).not.toBeNull();

    const scope = within(updateStatusCard as HTMLElement);
    const selected = scope.getByText("New");
    const nonSelected = scope.getByText("Under Review");

    expect(selected.className).toContain("shadow");
    expect(nonSelected.className).toContain("opacity-60");

    await user.click(nonSelected);

    await waitFor(() => {
      expect(screen.getByText(/Status updated to "Under Review"/)).toBeInTheDocument();
    });
  });
});

