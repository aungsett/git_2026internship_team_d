"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "../lib/apis";

export default function ApplicantDashboard() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen text-[#1e293b]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 bg-white/95 backdrop-blur-xl border-b border-[#e2e8f0]">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 text-lg sm:text-xl font-bold text-[#1e293b] no-underline">
          <span className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-cyan-200 to-purple-300 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0">
            🎯
          </span>
          RecruitPro
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <Link href="/applicant/apply" className="text-[#64748b] text-sm sm:text-base font-medium no-underline hover:text-[#1e293b] py-2">
            Apply
          </Link>
          <Link href="/dashboard" className="text-indigo-500 text-sm sm:text-base font-medium no-underline py-2">
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#64748b] text-sm sm:text-base font-medium hover:text-[#1e293b] bg-transparent border-none cursor-pointer flex items-center gap-2 py-2"
          >
            🚪 Log out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="pt-[88px] sm:pt-[100px] lg:pt-[120px] pb-10 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-[900px] mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-linear-to-r from-purple-200 to-purple-300 text-purple-800 rounded-[16px] sm:rounded-[20px] text-[0.75rem] sm:text-[0.85rem] font-semibold mb-3 sm:mb-4">
            Welcome Back
          </span>
          <h1 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-extrabold mb-2 sm:mb-3 text-[#0f172a]">
            Applicant Dashboard
          </h1>
          <p className="text-[#64748b] text-[0.95rem] sm:text-[1.1rem] max-w-[500px] mx-auto leading-relaxed px-1">
            Manage your applications and track your progress.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-[#f1f5f9]">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-2">
                Ready to Apply?
              </h2>
              <p className="text-[#64748b] text-sm sm:text-base leading-relaxed">
                Submit your application for a course. You can fill in your
                personal details, education, experience, and attach your CV.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/applicant/apply"
              className="inline-flex items-center justify-center gap-2 py-4 px-6 sm:px-8 bg-linear-to-r from-purple-400 to-indigo-500 text-white rounded-[14px] font-semibold no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] min-h-[48px] w-full sm:w-auto"
            >
              📄 Apply for a course
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 py-4 px-6 sm:px-8 bg-white border-2 border-[#e2e8f0] text-[#475569] rounded-[14px] font-semibold no-underline transition-all duration-300 hover:bg-[#f8fafc] hover:border-[#cbd5e1] min-h-[48px] w-full sm:w-auto"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
