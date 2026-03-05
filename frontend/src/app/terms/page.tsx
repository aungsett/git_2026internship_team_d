import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen text-[#1e293b]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex justify-between items-center bg-white/90 backdrop-blur-xl border-b border-[#e2e8f0]">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold text-[#1e293b] no-underline"
        >
          <span className="w-10 h-10 bg-linear-to-br from-cyan-200 to-purple-300 rounded-xl flex items-center justify-center text-lg">
            🎯
          </span>
          RecruitPro
        </Link>
        <Link
          href="/signup"
          className="text-[#64748b] font-medium no-underline hover:text-[#1e293b] transition-colors"
        >
          ← Back to Sign Up
        </Link>
      </nav>

      <main className="pt-[120px] pb-[60px] px-6 lg:px-12 max-w-[800px] mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-linear-to-r from-purple-200 to-purple-300 text-purple-800 rounded-[20px] text-[0.85rem] font-semibold mb-4">
            Legal
          </span>
          <h1 className="text-[2.5rem] font-extrabold text-[#0f172a] mb-3">
            Terms & Conditions
          </h1>
          <p className="text-[#64748b] text-[1.1rem]">
            Please read these terms carefully before using our services.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-[#f1f5f9]">
          <p className="text-[#475569] leading-relaxed mb-6">
            Welcome to our application. By creating an account and using our
            services, you agree to the following terms and conditions.
          </p>

          <Section num="01" title="Account Responsibility">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account.
          </Section>

          <Section num="02" title="Acceptable Use">
            You agree not to misuse the service, attempt unauthorized access, or
            engage in activities that disrupt the platform.
          </Section>

          <Section num="03" title="Privacy Policy">
            Your personal information is handled according to our privacy
            practices. We do not sell your data to third parties.
          </Section>

          <Section num="04" title="Termination">
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </Section>

          <Section num="05" title="Changes to Terms">
            We may update these Terms & Conditions at any time. Continued use of
            the service means you accept the updated terms.
          </Section>

          <div className="mt-8 pt-6 border-t border-[#f1f5f9]">
            <p className="text-sm text-[#94a3b8]">
              Last updated: February 2026
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-start gap-4 mb-3">
        <span className="w-10 h-10 bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-[0.9rem] shrink-0">
          {num}
        </span>
        <h2 className="text-lg font-bold text-[#0f172a] pt-2">{title}</h2>
      </div>
      <p className="text-[#475569] leading-relaxed ml-14">{children}</p>
    </div>
  );
}
