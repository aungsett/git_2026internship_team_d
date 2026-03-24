import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import ApplicantDashboard from "@/app/dashboard/page";
import type * as ApisModule from "@/app/lib/apis";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("@/app/lib/apis", () => {
  const actual = jest.requireActual("@/app/lib/apis");
  return {
    ...actual,
    getToken: jest.fn(() => "token"),
    getMyApplicationStatuses: jest.fn(async () => [
      {
        application_id: 12,
        course_name: "Business Japanese",
        status: "Under Review",
        applied_on: "2026-03-10T10:00:00.000Z",
        last_updated: "2026-03-12T10:00:00.000Z",
      },
    ]),
  };
});

const mockedApis = jest.requireMock("@/app/lib/apis") as jest.Mocked<
  typeof ApisModule
>;

describe("Applicant dashboard page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows submitted applications with status", async () => {
    render(<ApplicantDashboard />);

    await waitFor(() => {
      expect(mockedApis.getMyApplicationStatuses).toHaveBeenCalled();
    });

    expect(screen.getByText("Your Applications")).toBeInTheDocument();
    expect(await screen.findByText("APP-2026-00012")).toBeInTheDocument();
    expect(screen.getByText("Business Japanese")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });

  it("redirects to /login when no token", () => {
    mockedApis.getToken.mockReturnValueOnce(null);

    render(<ApplicantDashboard />);

    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
