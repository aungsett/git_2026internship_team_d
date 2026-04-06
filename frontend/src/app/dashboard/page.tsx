"use client";

/**
 * Applicant dashboard: post-login hub with link to apply and logout.
 * Redirects to /login if no token is present.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getMyApplicationStatuses,
  getToken,
  type MyApplicationStatus,
} from "../lib/apis";

/* ------------------------------------------------------------------ */
/*  Status visual config                                                */
/* ------------------------------------------------------------------ */
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; icon: string; label: string }
> = {
  New: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    icon: "✨",
    label: "New",
  },
  "Under Review": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: "🔍",
    label: "Under Review",
  },
  Shortlisted: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: "🎉",
    label: "Shortlisted",
  },
  Rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    icon: "📭",
    label: "Rejected",
  },
};

const DEFAULT_STATUS = {
  bg: "bg-slate-50",
  text: "text-slate-700",
  dot: "bg-slate-400",
  icon: "📋",
  label: "Unknown",
};

/* ------------------------------------------------------------------ */
/*  Greeting helper                                                     */
/* ------------------------------------------------------------------ */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                     */
/* ------------------------------------------------------------------ */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white border border-[#f1f5f9] p-5 sm:p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-slate-100 mb-2" />
      <div className="h-3 w-2/3 rounded bg-slate-100" />
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function ApplicantDashboard() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<MyApplicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Skip check while session is loading
    if (status === "loading") return;

    // 🚨 If not authenticated (no Google session AND no local token) → redirect
    if (status === "unauthenticated" && !getToken()) {
      router.replace("/login");
      return;
    }

    // ✅ Authenticated (either via Google or local token) → fetch data
    getMyApplicationStatuses()
      .then(setItems)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Failed to load application status"
        )
      )
      .finally(() => setLoading(false));
  }, [router, status]);

  /** Clears token/role from localStorage and redirects to applicant login. */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.replace("/login");
  };

  const greeting = mounted ? getGreeting() : "Welcome";

  /* Navbar scroll shadow */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

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
          <img
            src="/logo.png"
            alt="RecruitPro Logo"
            className="h-[40px] sm:h-[50px] w-auto"
          />
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link
            href="/applicant/apply"
            className="text-[#475569] text-sm sm:text-[0.9rem] font-medium no-underline hover:text-[#0f172a] transition-colors py-2 px-3 rounded-lg hover:bg-slate-100"
          >
            Apply
          </Link>
          <Link
            href="/dashboard"
            className="text-indigo-600 text-sm sm:text-[0.9rem] font-semibold no-underline py-2 px-3 rounded-lg bg-indigo-50"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#64748b] text-sm sm:text-[0.9rem] font-medium hover:text-rose-600 bg-transparent border-none cursor-pointer flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-rose-50 transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      </nav>

      {/* ==================== MAIN ==================== */}
      <main className="pt-[80px] sm:pt-[90px] pb-10 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-[1000px] mx-auto">
        {/* -------- Hero / Greeting -------- */}
        <div className="mb-8 sm:mb-10 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600 mb-1 tracking-wide uppercase">
                {greeting} 👋
              </p>
              <h1 className="text-[1.75rem] sm:text-[2.25rem] font-extrabold text-[#0f172a] tracking-tight leading-tight">
                Your Dashboard
              </h1>
              <p className="text-[#64748b] text-sm sm:text-base mt-1 max-w-[400px]">
                Track your applications, view statuses, and take the next step
                in your career journey.
              </p>
            </div>
            {/*<Link
              href="/applicant/apply"
              className="group inline-flex items-center justify-center gap-2 py-3 px-7 text-white rounded-xl font-semibold text-sm sm:text-base no-underline transition-all duration-300 hover:-translate-y-0.5 shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                boxShadow: "0 8px 25px rgba(99,102,241,.25)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              New Application
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>*/}
          </div>
        </div>

        {/* -------- Quick Apply Card -------- */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background:
              "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, #c4b5fd 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #67e8f9 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center text-3xl shrink-0">
              🚀
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Ready to Apply?
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base leading-relaxed max-w-[480px]">
                Submit your application in minutes. Fill in your personal
                details, education, experience, and attach your CV.
              </p>
            </div>
            <Link
              href="/applicant/apply"
              className="group inline-flex items-center justify-center gap-2 py-3.5 px-7 bg-white text-indigo-700 rounded-xl font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(0,0,0,.2)] shrink-0 w-full sm:w-auto"
            >
              Start Application
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-1"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>

        {/* -------- Applications Section -------- */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
                Your Applications
              </h2>
              {!loading && items.length > 0 && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">
                  {items.length}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-center">
              <p className="text-rose-600 text-sm sm:text-base font-medium">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-semibold text-rose-700 underline underline-offset-2 bg-transparent border-none cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#f1f5f9] p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,.04)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                📋
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">
                No Applications Yet
              </h3>
              <p className="text-[#64748b] text-sm sm:text-base mb-6 max-w-[360px] mx-auto">
                You haven&apos;t submitted any applications. Start your journey
                by applying for a role today!
              </p>
              <Link
                href="/applicant/apply"
                className="inline-flex items-center gap-2 py-3 px-6 text-white rounded-xl font-semibold text-sm no-underline transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 8px 25px rgba(99,102,241,.25)",
                }}
              >
                Apply Now →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => {
                const ref = `APP-${new Date(it.applied_on).getFullYear()}-${String(it.application_id).padStart(5, "0")}`;
                const updatedAt = it.last_updated || it.applied_on;
                const sc = STATUS_CONFIG[it.status] || DEFAULT_STATUS;
                const appliedDate = new Date(
                  it.applied_on
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const updatedDate = updatedAt
                  ? new Date(updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—";

                return (
                  <div
                    key={it.application_id}
                    className="group relative bg-white rounded-2xl border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                    style={{
                      animationDelay: `${idx * 80}ms`,
                    }}
                  >
                    {/* Left accent bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-[3px] ${sc.dot} rounded-l-2xl`}
                    />

                    <div className="p-5 sm:p-6 pl-6 sm:pl-7">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Left: Icon + Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className={`w-12 h-12 ${sc.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}
                          >
                            {sc.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm sm:text-base font-bold text-[#0f172a]">
                                {it.course_name || "Application"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                                />
                                {sc.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#94a3b8]">
                              <span className="font-mono tracking-tight">
                                {ref}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span>Applied {appliedDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Updated + Arrow */}
                        <div className="flex items-center gap-3 sm:gap-4 pl-16 sm:pl-0">
                          <div className="text-right">
                            <p className="text-[10px] sm:text-xs text-[#94a3b8] uppercase tracking-wide font-medium mb-0.5">
                              Updated
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-[#475569]">
                              {updatedDate}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* -------- Help Tip -------- */}
        <div className="mt-10 rounded-2xl bg-white border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,.04)] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-lg shrink-0">
              💡
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a] mb-1">
                Need Help?
              </h3>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Your application will be reviewed within 5–7 business days. You
                will receive email notifications when your application status
                changes. If you have any questions, please contact our support
                team.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
