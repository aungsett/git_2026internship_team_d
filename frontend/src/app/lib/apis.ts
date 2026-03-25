/**
 * Frontend API client for the ATS backend.
 * - Login goes through Next.js API routes (/api/login/user, /api/login/admin) which proxy to backend.
 * - Other calls use API_URL (backend base). NEXT_PUBLIC_API_URL can override for production.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL
  || (typeof window !== "undefined" ? "/api/v1" : "http://localhost:5000/api/v1");

type LoginResponse = {
  token: string;
  role: string;
};

type LoginErrorResponse = {
  error?: string;
  redirectTo?: string;
  actionText?: string;
};

export class LoginApiError extends Error {
  redirectTo?: string;
  actionText?: string;

  constructor(message: string, redirectTo?: string, actionText?: string) {
    super(message);
    this.name = "LoginApiError";
    this.redirectTo = redirectTo;
    this.actionText = actionText;
  }
}


/** Shared login helper: POSTs to given Next.js API path (user or admin), returns token and role or throws. */
async function loginByPath(path: string, email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as LoginResponse | LoginErrorResponse;

  if (!res.ok) {
    const errorData = data as LoginErrorResponse;
    throw new LoginApiError(
      errorData.error || "Login failed",
      errorData.redirectTo,
      errorData.actionText
    );
  }

  return data as LoginResponse;
}

export async function userLoginRequest(email: string, password: string) {
  return loginByPath("/api/login/user", email, password);
}

export async function adminLoginRequest(email: string, password: string) {
  return loginByPath("/api/login/admin", email, password);
}


export async function registerRequest(
  full_name: string,
  email: string,
  password: string
) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ full_name, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}

/** Get stored auth token (client-side only). */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Fetch courses for applicant form. */
export async function getCourses() {
  const res = await fetch(`${API_URL}/courses`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load courses");
  return data;
}

export type ApplicationFormData = {
  full_name?: string;
  phone_number: string;
  location: string;
  date_of_birth: string;
  highest_degree: string;
  field_of_study: string;
  university: string;
  graduation_year: string;
  gpa_percentage: string;
  years_experience: string;
  current_job_title: string;
  company_name: string;
  industry: string;
  professional_summary: string;
  course_id: string;
  course_schedule?: string;
  cv_file?: File | null;
};

export type SubmitApplicationResponse = {
  message: string;
  application_id: number;
  application_ref: string;
};

export type MyApplicationStatus = {
  application_id: number;
  course_name: string;
  status: string;
  applied_on: string;
  last_updated?: string;
};

/** Submit application (multipart). Call from client with getToken(). */
export async function submitApplication(form: ApplicationFormData) {
  const token = getToken();
  if (!token) throw new Error("You must be logged in to apply.");

  const body = new FormData();
  body.append("phone_number", form.phone_number ?? "");
  body.append("location", form.location ?? "");
  body.append("date_of_birth", form.date_of_birth ?? "");
  body.append("highest_degree", form.highest_degree ?? "");
  body.append("field_of_study", form.field_of_study ?? "N/A");
  body.append("university", form.university ?? "N/A");
  body.append("graduation_year", (form.graduation_year && form.graduation_year.trim() !== "") ? form.graduation_year : "2024");
  body.append("gpa_percentage", (form.gpa_percentage != null && form.gpa_percentage.trim() !== "") ? form.gpa_percentage : "0");
  body.append("years_experience", (form.years_experience != null && form.years_experience.trim() !== "") ? form.years_experience : "0");
  body.append("current_job_title", form.current_job_title);
  body.append("company_name", form.company_name);
  body.append("industry", form.industry);
  body.append("professional_summary", form.professional_summary ?? "");
  body.append("course_id", form.course_id ?? "");
  body.append("course_schedule", form.course_schedule ?? "");
  if (form.full_name) body.append("full_name", form.full_name);
  if (form.cv_file) body.append("cv_file", form.cv_file);

  const res = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit application");
  return data as SubmitApplicationResponse;
}

/** Applicant dashboard list: submitted applications with latest status. */
export async function getMyApplicationStatuses(): Promise<MyApplicationStatus[]> {
  const token = getToken();
  if (!token) throw new Error("You must be logged in to view your application status.");
  const res = await fetch(`${API_URL}/applications/my-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load application statuses");
  return data as MyApplicationStatus[];
}

// ——— Admin API (use with admin token) ———

function adminHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type AdminApplication = {
  application_id: number;
  status: string;
  applied_on: string;
  full_name: string;
  email: string;
  phone_number: string;
  highest_degree: string;
  years_experience: number | string;
  course_name: string;
  course_level: string;
  cv_link?: string;
};

export type AdminApplicationDetail = AdminApplication & {
  location: string | null;
  date_of_birth: string | null;
  field_of_study: string | null;
  university: string | null;
  graduation_year: number | null;
  gpa_percentage: string | null;
  current_job_title: string | null;
  company_name: string | null;
  industry: string | null;
  professional_summary: string | null;
  file_name?: string;
  course_schedule?: string | null;
};

export type AdminStats = {
  total_applications: string;
  this_week: string;
  shortlisted: string;
  pending_review: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/admin/stats`, { headers: adminHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load stats");
  return data;
}

export async function getAdminApplications(params?: {
  search?: string;
  status?: string;
  course_id?: string;
}): Promise<AdminApplication[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status && params.status !== "All Status") q.set("status", params.status);
  if (params?.course_id && params.course_id !== "All Courses") q.set("course_id", params.course_id);
  const url = `${API_URL}/admin/applications${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, { headers: adminHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load applications");
  return data;
}

export async function getAdminApplicationById(id: string): Promise<AdminApplicationDetail> {
  const res = await fetch(`${API_URL}/admin/applications/${id}`, { headers: adminHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load application");
  return data;
}

/** Returns URL to download CV (same origin as API). */
export function getAdminCvDownloadUrl(applicationId: string): string {
  const token = getToken();
  return `${API_URL}/admin/applications/${applicationId}/cv${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

/** Download CV: in browser pass token in header via fetch and blob. */
export async function downloadAdminCv(applicationId: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}/admin/applications/${applicationId}/cv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to download CV");
  return res.blob();
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update status");
}

export async function getAdminExportCsv(params?: {
  search?: string;
  status?: string;
  course_id?: string;
}): Promise<Blob> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status && params.status !== "All Status") q.set("status", params.status);
  if (params?.course_id && params.course_id !== "All Courses") q.set("course_id", params.course_id);
  const url = `${API_URL}/admin/export/csv${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}
