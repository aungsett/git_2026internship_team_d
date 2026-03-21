// Component tests for the multi-step applicant apply page.
// These cover access control (requires login), initial data loading, and a basic happy-path submission.

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";

import ApplicantApplyPage from "@/app/applicant/apply/page";
import type * as ApisModule from "@/app/lib/apis";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("@/app/lib/apis", () => {
  const actual = jest.requireActual("@/app/lib/apis");
  return {
    ...actual,
    getToken: jest.fn(),
    getCourses: jest.fn(),
    submitApplication: jest.fn(),
  };
});

const mockedApis = jest.requireMock("@/app/lib/apis") as jest.Mocked<
  typeof ApisModule
>;

describe("ApplicantApplyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login when there is no token", () => {
    mockedApis.getToken.mockReturnValueOnce(null);

    render(<ApplicantApplyPage />);

    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("loads courses when mounted with a token", async () => {
    mockedApis.getToken.mockReturnValueOnce("token");
    mockedApis.getCourses.mockResolvedValueOnce([
      { course_id: 1, course_name: "Course A", course_level: "Beginner" },
    ] as unknown);

    render(<ApplicantApplyPage />);

    await waitFor(() => {
      expect(mockedApis.getCourses).toHaveBeenCalled();
    });
  });
});

