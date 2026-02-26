import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.25),_transparent_40%)]" />

      <div className="relative mx-auto flex min-h-[85vh] w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          <p className="text-sm font-medium text-indigo-200">ATS Portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Choose your login</h1>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">
            Continue with the correct portal for a seamless sign-in experience.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/login"
              className="group rounded-2xl border border-white/20 bg-white/10 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              aria-label="Go to General Login page"
            >
              <p className="text-lg font-semibold">General Login</p>
              <p className="mt-1 text-sm text-slate-200">For applicants and users</p>
              <p className="mt-4 text-sm font-medium text-indigo-200 transition group-hover:text-indigo-100">Continue →</p>
            </Link>

            <Link
              href="/admin-login"
              className="group rounded-2xl border border-white/20 bg-white/10 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-300/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
              aria-label="Go to Admin Login page"
            >
              <p className="text-lg font-semibold">Admin Login</p>
              <p className="mt-1 text-sm text-slate-200">For administrators only</p>
              <p className="mt-4 text-sm font-medium text-fuchsia-200 transition group-hover:text-fuchsia-100">Continue →</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}