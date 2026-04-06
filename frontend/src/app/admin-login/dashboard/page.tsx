"use client";

/**
 * Admin dashboard: stats cards, status distribution chart, filters, paginated applications table, CSV export.
 * Requires admin token; redirects to /admin-login if missing. Row click navigates to applicant detail.
 */

import { useState, useEffect, useMemo } from "react";
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
  "from-indigo-400 to-indigo-600",
  "from-purple-400 to-purple-600",
  "from-cyan-400 to-cyan-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  New: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Under Review": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Shortlisted: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Rejected: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

const DEFAULT_STYLE = { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" };

const PER_PAGE = 10;

/* ------------------------------------------------------------------ */
/*  Mini Donut Chart (pure SVG, no dependencies)                       */
/* ------------------------------------------------------------------ */
function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-sm">
        No data
      </div>
    );
  }

  const radius = 70;
  const cx = 90;
  const cy = 90;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const pct = d.value / total;
      const dash = pct * circumference;
      const gap = circumference - dash;
      const seg = { ...d, pct, dashArray: `${dash} ${gap}`, dashOffset: -offset };
      offset += dash;
      return seg;
    });

  return (
    <div className="flex items-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-700"
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-2xl font-extrabold" fill="#0f172a" fontSize="28">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
          Total
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-col gap-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-sm text-[#475569]">{d.label}</span>
            <span className="text-sm font-bold text-[#0f172a] ml-auto pl-3">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini horizontal bar chart                                          */
/* ------------------------------------------------------------------ */
function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#475569] font-medium">{d.label}</span>
            <span className="text-sm font-bold text-[#0f172a]">{d.value}</span>
          </div>
          <div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
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
  const [currentPage, setCurrentPage] = useState(1);

  /* Navbar scroll effect */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

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
        if (!cancelled) {
          setApplications(data);
          setCurrentPage(1); // reset to page 1 on filter change
        }
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

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(applications.length / PER_PAGE));
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return applications.slice(start, start + PER_PAGE);
  }, [applications, currentPage]);

  /* Chart data derived from applications */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { New: 0, "Under Review": 0, Shortlisted: 0, Rejected: 0 };
    applications.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    return counts;
  }, [applications]);

  const donutData = [
    { label: "New", value: statusCounts["New"], color: "#6366f1" },
    { label: "Under Review", value: statusCounts["Under Review"], color: "#f59e0b" },
    { label: "Shortlisted", value: statusCounts["Shortlisted"], color: "#10b981" },
    { label: "Rejected", value: statusCounts["Rejected"], color: "#f43f5e" },
  ];

  /** Triggers CSV download. */
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
          sub: "All time",
          icon: "📊",
          gradient: "from-indigo-500 to-blue-600",
          lightBg: "bg-indigo-50",
        },
        {
          label: "This Week",
          value: stats.this_week,
          sub: "Last 7 days",
          icon: "📈",
          gradient: "from-purple-500 to-violet-600",
          lightBg: "bg-purple-50",
        },
        {
          label: "Shortlisted",
          value: stats.shortlisted,
          sub: "Selected",
          icon: "✅",
          gradient: "from-emerald-500 to-teal-600",
          lightBg: "bg-emerald-50",
        },
        {
          label: "Pending Review",
          value: stats.pending_review,
          sub: "Needs attention",
          icon: "⏳",
          gradient: "from-amber-500 to-orange-600",
          lightBg: "bg-amber-50",
        },
      ]
    : [];

  const selectBgSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`;

  return (
    <div className="min-h-screen text-[#1e293b] bg-[#f8fafc]">
      {/* ==================== NAV ==================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-2.5 sm:py-3 flex flex-wrap justify-between items-center gap-2 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,.06)]"
            : "bg-white/70 backdrop-blur-xl"
        } border-b border-white/60`}
      >
        <Link href="/" className="flex items-center no-underline">
          <img src="/logo.png" alt="RecruitPro Logo" className="h-[40px] sm:h-[50px] w-auto" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/admin-login/dashboard"
            className="text-indigo-600 text-sm sm:text-[0.9rem] font-semibold no-underline py-2 px-3 rounded-lg bg-indigo-50"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#64748b] text-sm sm:text-[0.9rem] font-medium hover:text-rose-600 bg-transparent border-none cursor-pointer flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-rose-50 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      </nav>

      {/* ==================== MAIN ==================== */}
      <main className="pt-[80px] sm:pt-[90px] pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-4 sm:pt-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-1 tracking-wide uppercase">
              Admin Panel
            </p>
            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-extrabold text-[#0f172a] tracking-tight">
              Recruitment Dashboard
            </h1>
            <p className="text-[#64748b] text-sm sm:text-base mt-1">
              Track, review, and manage all applications at a glance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="group inline-flex items-center gap-2 py-3 px-6 bg-white border-2 border-[#e2e8f0] rounded-xl text-[#475569] font-semibold cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-sm shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {/* -------- Stats Cards -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,.08)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-medium text-[#94a3b8] uppercase tracking-wide">
                  {s.label}
                </span>
                <div className={`w-10 h-10 ${s.lightBg} rounded-xl flex items-center justify-center text-lg`}>
                  {s.icon}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight mb-1">
                {s.value}
              </div>
              <span className="text-xs text-[#94a3b8]">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* -------- Charts Row -------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Donut chart */}
          <div className="bg-white rounded-2xl p-6 border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
            <h3 className="text-sm font-bold text-[#0f172a] mb-5 uppercase tracking-wide">
              Status Distribution
            </h3>
            <DonutChart data={donutData} />
          </div>

          {/* Horizontal bar chart */}
          <div className="bg-white rounded-2xl p-6 border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
            <h3 className="text-sm font-bold text-[#0f172a] mb-5 uppercase tracking-wide">
              Application Pipeline
            </h3>
            <HorizontalBarChart data={donutData} />
          </div>
        </div>

        {/* -------- Filters -------- */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center mb-5">
          <div className="flex-1 min-w-[280px] flex items-center gap-3 bg-white border-2 border-[#e2e8f0] rounded-xl px-4 focus-within:border-indigo-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="flex-1 border-none py-3 text-sm outline-none bg-transparent placeholder:text-[#94a3b8]"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-3 px-4 pr-9 bg-white border-2 border-[#e2e8f0] rounded-xl text-sm text-[#475569] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] hover:border-indigo-300 transition-colors"
              style={{ backgroundImage: selectBgSvg }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="py-3 px-4 pr-9 bg-white border-2 border-[#e2e8f0] rounded-xl text-sm text-[#475569] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] hover:border-indigo-300 transition-colors"
              style={{ backgroundImage: selectBgSvg }}
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

        {/* -------- Applications Table -------- */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,.04)] border border-[#f1f5f9]">
          {loading ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#64748b] text-sm">Loading applications...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[720px]">
                <thead>
                  <tr>
                    {["Applicant", "Education", "Experience", "Course", "Status", "Date", ""].map((h) => (
                      <th
                        key={h}
                        className="py-3.5 px-5 text-left bg-[#f8fafc] text-[0.75rem] font-semibold uppercase tracking-wider text-[#94a3b8] first:rounded-tl-2xl last:rounded-tr-2xl"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                          📋
                        </div>
                        <p className="text-[#64748b] font-medium">No applications found.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedApps.map((a, i) => {
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
                      const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      const sc = STATUS_STYLE[a.status] || DEFAULT_STYLE;

                      return (
                        <tr
                          key={a.application_id}
                          onClick={() =>
                            router.push(
                              `/admin-login/dashboard/applicants/${a.application_id}`
                            )
                          }
                          className="border-t border-[#f1f5f9] cursor-pointer transition-colors hover:bg-indigo-50/30"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-[40px] h-[40px] rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center font-semibold text-[0.8rem] text-white shadow-sm`}
                              >
                                {initials}
                              </div>
                              <div>
                                <strong className="block text-sm text-[#0f172a]">
                                  {a.full_name}
                                </strong>
                                <span className="text-xs text-[#94a3b8]">
                                  {a.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm text-[#475569]">
                            {a.highest_degree ?? "—"}
                          </td>
                          <td className="py-4 px-5 text-sm text-[#475569]">
                            {a.years_experience
                              ? `${a.years_experience} yrs`
                              : "—"}
                          </td>
                          <td className="py-4 px-5">
                            <span className="py-1 px-2.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                              {a.course_name}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {a.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-sm text-[#64748b]">{date}</td>
                          <td className="py-4 px-5">
                            <Link
                              href={`/admin-login/dashboard/applicants/${a.application_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="group inline-flex items-center gap-1 py-2 px-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-indigo-600 font-semibold no-underline transition-all hover:bg-indigo-50 hover:border-indigo-300 text-xs"
                            >
                              View
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && applications.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-5 bg-[#f8fafc] border-t border-[#f1f5f9] gap-3">
              <span className="text-sm text-[#64748b]">
                Showing {(currentPage - 1) * PER_PAGE + 1}–
                {Math.min(currentPage * PER_PAGE, applications.length)} of{" "}
                {applications.length} applicants
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg border border-[#e2e8f0] bg-white text-[#475569] flex items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, current, and neighbors
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-[#94a3b8] text-sm">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-9 h-9 rounded-lg border text-sm font-semibold flex items-center justify-center cursor-pointer transition-all ${
                          p === currentPage
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-lg border border-[#e2e8f0] bg-white text-[#475569] flex items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
