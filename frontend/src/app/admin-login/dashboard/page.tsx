"use client";

/**
 * Admin dashboard: stats cards, filters (search, status, course), applications table, CSV export.
 * Requires admin token; redirects to /admin-login if missing. Row click navigates to applicant detail.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  getAdminStats,
  getAdminApplications,
  getCourses,
  getAdminExportCsv,
  type AdminApplication,
  type AdminStats,
} from "@/app/lib/apis";

type Course = { course_id: number; course_name: string; course_level: string };

const STATUS_OPTIONS = [
  "All Status",
  "New",
  "Under Review",
  "Shortlisted",
  "Rejected",
];

const AVATAR_COLORS = [
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-green-400 to-green-600",
  "from-blue-400 to-blue-600",
  "from-orange-400 to-orange-600",
];

export default function AdminDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin-login");
      return;
    }
    getAdminStats()
      .then(setStats)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load stats")
      );
    getCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    getAdminApplications({
      search: search || undefined,
      status: statusFilter !== "All Status" ? statusFilter : undefined,
      course_id: courseFilter !== "All Courses" ? courseFilter : undefined,
    })
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, courseFilter]);

  /** Triggers CSV download using blob from admin export API. Passes active filters so export matches what is visible in the table. */
  const handleExportCsv = () => {
    getAdminExportCsv({
      search: search || undefined,
      status: statusFilter !== "All Status" ? statusFilter : undefined,
      course_id: courseFilter !== "All Courses" ? courseFilter : undefined,
    })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `applicants_export_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => setError("Export failed"));
  };

  /** Clears token/role and redirects to admin login. */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.replace("/admin-login");
  };

  const statCards = stats
    ? [
        {
          label: "Total Applications",
          value: stats.total_applications,
          change: "All time",
          icon: "📊",
          accent: "border-l-purple-400",
        },
        {
          label: "This Week",
          value: stats.this_week,
          change: "Last 7 days",
          icon: "📈",
          accent: "border-l-blue-400",
        },
        {
          label: "Shortlisted",
          value: stats.shortlisted,
          change: "Selected",
          icon: "✅",
          accent: "border-l-green-400",
        },
        {
          label: "Pending Review",
          value: stats.pending_review,
          change: "Needs attention",
          icon: "⏳",
          accent: "border-l-orange-400",
        },
      ]
    : [];

  return (
    <div className="min-h-screen text-[#1e293b]">
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
          <button
            onClick={handleLogout}
            className="text-[#64748b] text-sm sm:text-base font-medium hover:text-[#1e293b] bg-transparent border-none cursor-pointer py-2"
          >
            🚪 Log out
          </button>
        </div>
      </nav>

      {/* Dashboard */}
      <main className="pt-[88px] sm:pt-[100px] pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-[2rem] font-extrabold text-[#0f172a]">
              Applicant Dashboard
            </h1>
            <p className="text-[#64748b] mt-1">
              Track and manage all applications
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="py-3 px-6 bg-white border-2 border-[#e2e8f0] rounded-xl text-[#475569] font-semibold cursor-pointer transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`bg-white rounded-[20px] p-6 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#f1f5f9] border-l-4 ${s.accent} transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)]`}
            >
              <div className="flex flex-col">
                <span className="text-[0.9rem] text-[#64748b] mb-2">
                  {s.label}
                </span>
                <span className="text-[2rem] font-extrabold text-[#0f172a] mb-1">
                  {s.value}
                </span>
                <span className="text-[0.8rem] text-[#64748b]">
                  {s.change}
                </span>
              </div>
              <div className="w-14 h-14 bg-[#f8fafc] rounded-[14px] flex items-center justify-center text-2xl">
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
          <div className="flex-1 min-w-[280px] flex items-center gap-3 bg-white border-2 border-[#e2e8f0] rounded-xl px-4 focus-within:border-purple-400">
            <span>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="flex-1 border-none py-3.5 text-[0.95rem] outline-none bg-transparent placeholder:text-[#94a3b8]"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-3 px-4 pr-9 bg-white border-2 border-[#e2e8f0] rounded-xl text-[0.9rem] text-[#475569] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="py-3 px-4 pr-9 bg-white border-2 border-[#e2e8f0] rounded-xl text-[0.9rem] text-[#475569] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              <option value="All Courses">All Courses</option>
              {courses.map((c) => (
                <option key={c.course_id} value={String(c.course_id)}>
                  {c.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[16px] sm:rounded-[20px] overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#f1f5f9] overflow-x-auto">
          {loading ? (
            <div className="p-8 sm:p-12 text-center text-[#64748b]">Loading...</div>
          ) : (
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className="py-4 px-5 text-left bg-[#f8fafc] text-[0.8rem] font-semibold uppercase tracking-[0.5px] text-[#64748b]">
                    Applicant
                  </th>
                  <th className="py-4 px-5 text-left bg-[#f8fafc] text-[0.8rem] font-semibold uppercase tracking-[0.5px] text-[#64748b]">
                    Education
                  </th>
                  <th className="py-4 px-5 text-left bg-[#f8fafc] text-[0.8rem] font-semibold uppercase tracking-[0.5px] text-[#64748b]">
                    Experience
                  </th>
                  <th className="py-4 px-5 text-left bg-[#f8fafc] text-[0.8rem] font-semibold uppercase tracking-[0.5px] text-[#64748b]">
                    Course
                  </th>
                  <th className="py-4 px-5 text-left bg-[#f8fafc] text-[0.8rem] font-semibold uppercase tracking-[0.5px] text-[#64748b]">
                    Status
                  </th>
                  <th className="py-4 px-5 text-left bg-[#f8fafc] text-[0.8rem] font-semibold uppercase tracking-[0.5px] text-[#64748b]">
                    Date
                  </th>
                  <th className="py-4 px-5 bg-[#f8fafc]"></th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-[#64748b]"
                    >
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((a, i) => {
                    const date = a.applied_on
                      ? new Date(a.applied_on).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—";
                    const initials =
                      a.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2) || "?";
                    const colorClass =
                      AVATAR_COLORS[i % AVATAR_COLORS.length];

                    return (
                      <tr
                        key={a.application_id}
                        onClick={() =>
                          router.push(
                            `/admin-login/dashboard/applicants/${a.application_id}`
                          )
                        }
                        className="border-t border-[#f1f5f9] cursor-pointer transition-colors hover:bg-purple-50/40"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-[42px] h-[42px] rounded-xl bg-linear-to-br ${colorClass} flex items-center justify-center font-semibold text-[0.85rem] text-white`}
                            >
                              {initials}
                            </div>
                            <div>
                              <strong className="block text-[#0f172a]">
                                {a.full_name}
                              </strong>
                              <span className="text-[0.85rem] text-[#94a3b8]">
                                {a.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {a.highest_degree ?? "—"}
                        </td>
                        <td className="py-4 px-5">
                          {a.years_experience
                            ? `${a.years_experience} years`
                            : "—"}
                        </td>
                        <td className="py-4 px-5">
                          <span className="py-1.5 px-3 bg-purple-100 text-purple-700 rounded-lg text-[0.8rem] font-medium">
                            {a.course_name}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="py-4 px-5">{date}</td>
                        <td className="py-4 px-5">
                          <Link
                            href={`/admin-login/dashboard/applicants/${a.application_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="py-2 px-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[10px] text-indigo-500 font-semibold no-underline transition-all hover:bg-purple-50 hover:border-purple-300 text-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {!loading && applications.length > 0 && (
            <div className="flex justify-between items-center py-4 px-5 bg-[#f8fafc] text-[#64748b] text-[0.9rem] border-t border-[#f1f5f9]">
              <span>
                Showing 1-{applications.length} of {applications.length}{" "}
                applicants
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** Renders application status with color-coded pill (New, Under Review, Shortlisted, Rejected). */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    New: "bg-[#e0e7ff] text-[#4f46e5]",
    "Under Review": "bg-[#fef3c7] text-[#d97706]",
    Shortlisted: "bg-[#d1fae5] text-[#059669]",
    Rejected: "bg-[#fee2e2] text-[#dc2626]",
  };
  return (
    <span
      className={`py-1.5 px-3.5 rounded-[20px] text-[0.8rem] font-medium ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
