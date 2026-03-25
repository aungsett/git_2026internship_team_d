import Link from "next/link";

/** Landing page: hero for job applications, primary CTA (Apply / Sign up). */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col text-[#1e293b] bg-[#f8fafc]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3 bg-white/95 backdrop-blur-xl border-b border-[#e2e8f0]">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 text-lg sm:text-xl font-bold text-[#1e293b] no-underline">
          <span className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-cyan-200 to-purple-300 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0">
            🎯
          </span>
          <span>RecruitPro</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Link
            href="/login"
            className="text-[#64748b] text-sm sm:text-base font-medium no-underline hover:text-[#1e293b] transition-colors py-2 px-1"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm sm:text-base font-semibold text-indigo-600 no-underline hover:text-indigo-700 transition-colors py-2 px-3 sm:px-4 rounded-xl hover:bg-indigo-50"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 pt-[88px] sm:pt-[100px] lg:pt-[120px] pb-8 sm:pb-10 lg:pb-12 px-4 sm:px-6 lg:px-12 max-w-[1100px] mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-linear-to-r from-purple-200 to-indigo-200 text-purple-800 rounded-[16px] sm:rounded-[20px] text-[0.75rem] sm:text-[0.85rem] font-semibold mb-4 sm:mb-5">
            Job Opportunities
          </span>
          <h1 className="text-[2rem] min-[480px]:text-[2.25rem] sm:text-[3rem] lg:text-[3.5rem] font-extrabold text-[#0f172a] leading-tight mb-4 sm:mb-5 px-1">
            Start Your
            <br className="sm:hidden" />
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Application Journey
            </span>
          </h1>
          <p className="text-[#64748b] text-base sm:text-lg max-w-[520px] mx-auto leading-relaxed px-2">
            Apply for roles that match your skills. We&apos;ll review your application and
            get back to you within 5–7 business days.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-14">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 sm:py-4 sm:px-10 bg-linear-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-semibold text-base sm:text-lg no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(99,102,241,0.35)] min-h-[52px]"
          >
            Apply for a job
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 bg-white border-2 border-[#e2e8f0] text-[#475569] rounded-2xl font-semibold text-base no-underline transition-all hover:bg-[#f8fafc] hover:border-[#cbd5e1] min-h-[52px]"
          >
            Already have an account? Log in
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-center text-[#94a3b8] text-sm">
          By applying you agree to our{" "}
          <Link href="/terms" className="text-indigo-500 font-medium no-underline hover:underline">
            Terms of Service & Privacy Policy
          </Link>
          .
        </p>
      </main>

      {/* Footer - minimal */}
      <footer className="border-t border-[#e2e8f0] bg-white/80 py-4 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[1100px] mx-auto flex flex-col min-[480px]:flex-row flex-wrap items-center justify-center sm:justify-between gap-4 text-sm text-[#64748b]">
          <span>© RecruitPro. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/terms" className="no-underline text-[#64748b] hover:text-[#1e293b]">
              Terms & Privacy
            </Link>
            <Link href="/login" className="no-underline text-[#64748b] hover:text-[#1e293b]">
              Applicant login
            </Link>
            <Link href="/admin-login" className="no-underline text-[#64748b] hover:text-[#1e293b]">
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
