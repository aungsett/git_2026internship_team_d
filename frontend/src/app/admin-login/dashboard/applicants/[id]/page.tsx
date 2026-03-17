"use client";

/**
 * Admin applicant detail page: full application info, CV download, and status update (New / Under Review / Shortlisted / Rejected).
 * Requires admin token; redirects to /admin-login if missing.
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  getAdminApplicationById,
  downloadAdminCv,
  updateApplicationStatus,
  type AdminApplicationDetail,
} from "@/app/lib/apis";

const STATUS_OPTIONS = ["New", "Under Review", "Shortlisted", "Rejected"];

export default function ApplicantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cvDownloading, setCvDownloading] = useState(false);
  // Short-lived success message shown near the top of the screen after status updates.
  const [toast, setToast] = useState<string | null>(null);

  // Auto-hide the toast after a small delay so it does not require manual dismissal.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!id) return;
    if (!getToken()) {
      router.replace("/admin-login");
      return;
    }
    getAdminApplicationById(id)
      .then(setDetail)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [id, router]);

  /** Updates application status via API and refreshes local detail. */
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      await updateApplicationStatus(id, newStatus);
      // Optimistically update local state so the new status and styling are reflected immediately.
      setDetail((d) => (d ? { ...d, status: newStatus } : null));
      setToast(`Status updated to "${newStatus}"`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  /** Fetches CV as blob and triggers browser download. */
  const handleDownloadCv = async () => {
    if (!id) return;
    setCvDownloading(true);
    try {
      const blob = await downloadAdminCv(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = detail?.file_name || "cv.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download CV");
    } finally {
      setCvDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin-login/dashboard"
            className="text-indigo-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const appliedDate = detail.applied_on
    ? new Date(detail.applied_on).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const dobDate = detail.date_of_birth
    ? new Date(detail.date_of_birth).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const initials =
    detail.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "?";

  const statusStyle: Record<string, string> = {
    New: "bg-[#e0e7ff] text-[#4f46e5]",
    "Under Review": "bg-[#fef3c7] text-[#d97706]",
    Shortlisted: "bg-[#d1fae5] text-[#059669]",
    Rejected: "bg-[#fee2e2] text-[#dc2626]",
  };

  const statusOptStyle: Record<string, string> = {
    New: "bg-[#e0e7ff] text-[#4f46e5]",
    "Under Review": "bg-[#fef3c7] text-[#d97706]",
    Shortlisted: "bg-[#d1fae5] text-[#059669]",
    Rejected: "bg-[#fee2e2] text-[#dc2626]",
  };

  return (
    <div className="min-h-screen text-[#1e293b]">
      {toast && (
        <div className="fixed top-[76px] sm:top-[88px] left-0 right-0 z-[60] flex justify-center px-4">
          <div className="pointer-events-none bg-[#eef2ff] text-[#1e293b] text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(148,163,184,0.35)] border border-[#c7d2fe] max-w-[520px] w-full sm:w-auto text-center">
            {toast}
          </div>
        </div>
      )}
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 bg-white/95 backdrop-blur-xl border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 sm:gap-2.5 text-lg sm:text-xl font-bold text-[#1e293b]">
          <span className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-cyan-200 to-purple-300 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0">
            🎯
          </span>
          RecruitPro
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/admin-login/dashboard" className="text-indigo-500 text-sm sm:text-base font-medium no-underline py-2">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Detail Page */}
      <main className="pt-[88px] sm:pt-[100px] pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 max-w-[1200px] mx-auto">
        <Link
          href="/admin-login/dashboard"
          className="inline-block text-[#64748b] no-underline mb-6 font-medium transition-colors hover:text-indigo-500"
        >
          ← Back to Dashboard
        </Link>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 mb-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#f1f5f9]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex flex-col min-[480px]:flex-row gap-4 sm:gap-6 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-purple-400 to-indigo-500 rounded-[16px] sm:rounded-[20px] flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-[1.5rem] sm:text-[1.75rem] font-extrabold text-[#0f172a] mb-1 break-words">
                  {detail.full_name}
                </h1>
                <p className="text-[#64748b] text-sm sm:text-base mb-3 break-all">{detail.email}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="py-1.5 px-3 sm:px-3.5 bg-purple-100 text-purple-700 rounded-[16px] sm:rounded-[20px] text-[0.75rem] sm:text-[0.8rem] font-medium">
                    {detail.course_name}
                  </span>
                  {detail.years_experience && (
                    <span className="py-1.5 px-3 sm:px-3.5 bg-blue-100 text-blue-700 rounded-[16px] sm:rounded-[20px] text-[0.75rem] sm:text-[0.8rem] font-medium">
                      {detail.years_experience} Years Exp
                    </span>
                  )}
                  <span
                    className={`py-1.5 px-3 sm:px-3.5 rounded-[16px] sm:rounded-[20px] text-[0.75rem] sm:text-[0.8rem] font-medium ${
                      statusStyle[detail.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {detail.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 lg:justify-end">
              <button
                type="button"
                onClick={handleDownloadCv}
                disabled={cvDownloading}
                className="w-full sm:w-auto bg-[#eef2ff] border border-[#c7d2fe] text-[#4f46e5] py-3 px-5 rounded-xl font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white hover:shadow-[0_8px_16px_rgba(99,102,241,0.2)] disabled:opacity-50 min-h-[48px]"
              >
                {cvDownloading ? "⏳" : "⬇️"} Download CV
              </button>
            </div>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            {/* Personal Info */}
            <InfoCard title="Personal Information">
              <InfoRow label="Full Name" value={detail.full_name} />
              <InfoRow label="Date of Birth" value={dobDate} />
              <InfoRow label="Email" value={detail.email} />
              <InfoRow label="Phone" value={detail.phone_number} />
              <InfoRow label="Location" value={detail.location} />
              <InfoRow label="Applied On" value={appliedDate} />
            </InfoCard>

            {/* Education */}
            <InfoCard title="Education & Background">
              <InfoRow label="Highest Degree" value={detail.highest_degree} />
              <InfoRow label="Field of Study" value={detail.field_of_study} />
              <InfoRow label="University" value={detail.university} />
              <InfoRow
                label="Graduation Year"
                value={detail.graduation_year}
              />
              <InfoRow label="GPA %" value={detail.gpa_percentage} />
              <InfoRow
                label="Experience"
                value={
                  detail.years_experience
                    ? `${detail.years_experience} years`
                    : null
                }
              />
              <InfoRow
                label="Course"
                value={`${detail.course_name} (${detail.course_level})`}
              />
              {detail.course_schedule && (
                <InfoRow
                  label="Course preference (schedule)"
                  value={detail.course_schedule}
                />
              )}
            </InfoCard>

            {/* Work Experience */}
            {(detail.current_job_title ||
              detail.company_name ||
              detail.industry) && (
              <InfoCard title="Work Experience">
                <InfoRow
                  label="Current Job Title"
                  value={detail.current_job_title}
                />
                <InfoRow label="Company" value={detail.company_name} />
                <InfoRow label="Industry" value={detail.industry} />
              </InfoCard>
            )}

            {/* Professional Summary */}
            {detail.professional_summary && (
              <InfoCard title="Additional Comments">
                <p className="text-[#475569] leading-[1.8]">
                  {detail.professional_summary}
                </p>
              </InfoCard>
            )}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-5">
            {/* Resume */}
            <InfoCard title="Resume / CV">
              <div className="bg-[#f8fafc] rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-linear-to-br from-indigo-100 to-indigo-200 rounded-[14px] flex items-center justify-center text-2xl">
                    📄
                  </div>
                  <div>
                    <strong className="block text-[#0f172a]">
                      {detail.file_name || "Resume.pdf"}
                    </strong>
                    <span className="text-[0.85rem] text-[#94a3b8]">
                      Uploaded {appliedDate}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadCv}
                    disabled={cvDownloading}
                    className="flex-1 py-3 bg-linear-to-r from-purple-400 to-indigo-500 border-none rounded-[10px] text-white font-semibold cursor-pointer transition-all hover:shadow-[0_8px_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            </InfoCard>

            {/* Update Status */}
            <InfoCard title="Update Status">
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {STATUS_OPTIONS.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={detail.status === s}
                      onChange={() => handleStatusChange(s)}
                      disabled={statusUpdating}
                      className="hidden"
                    />
                    <span
                      className={`block py-3.5 text-center rounded-xl font-semibold border-2 transition-all ${
                        detail.status === s
                          ? `${statusOptStyle[s] || "bg-gray-100 text-gray-700"} border-current shadow-[0_10px_24px_rgba(0,0,0,0.10)]`
                          : `${statusOptStyle[s] || "bg-gray-100 text-gray-700"} opacity-60 border-transparent hover:opacity-90`
                      }`}
                    >
                      {s}
                    </span>
                  </label>
                ))}
              </div>
              {statusUpdating && (
                <p className="text-sm text-[#64748b] text-center">
                  Updating...
                </p>
              )}
            </InfoCard>
          </div>
        </div>

        {/* Nav Arrows */}
        <div className="flex justify-between mt-8">
          <Link
            href="/admin-login/dashboard"
            className="py-3.5 px-7 bg-white border-2 border-[#e2e8f0] rounded-xl text-[#475569] font-semibold no-underline transition-all hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
          >
            ← Back to List
          </Link>
        </div>
      </main>
    </div>
  );
}

/** Section card with title and border for detail layout. */
function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[20px] p-7 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#f1f5f9]">
      <h3 className="text-[1.1rem] font-bold text-[#0f172a] mb-5 pb-4 border-b border-[#f1f5f9]">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Single label-value row; optional highlight style. Renders nothing if value is null/empty. */
function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}) {
  if (value == null || value === "") return null;
  return (
    <div
      className={`flex justify-between items-center py-3 px-4 rounded-xl mb-2 ${
        highlight ? "bg-purple-100" : "bg-[#f8fafc]"
      }`}
    >
      <span className="text-[0.9rem] text-[#64748b]">{label}</span>
      <span
        className={`font-semibold ${
          highlight ? "text-indigo-500" : "text-[#0f172a]"
        }`}
      >
        {String(value)}
      </span>
    </div>
  );
}
