"use client";

/**
 * LoginCard — Reusable login UI for both applicant and admin.
 * Renders a split layout: left panel (benefits/visual), right panel (email + password form).
 * On success stores token and role in localStorage and redirects to /dashboard or /admin-login/dashboard.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminLoginRequest, userLoginRequest } from "../app/lib/apis";
import { signIn } from "next-auth/react";

type Props = {
  loginType: "user" | "admin";
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  buttonText: string;
  switchText: string;
  switchHref: string;
};

type Benefit = { icon: string; text: string };

type VisualConfig = {
  badge: string;
  heading: string;
  description: string;
  benefits: Benefit[];
};

const VISUAL: Record<"user" | "admin", VisualConfig> = {
  user: {
    badge: "✨ Your Career Portal",
    heading: "Track Your Applications Effortlessly",
    description:
      "Sign in to manage your job applications, update your profile, and stay connected with potential employers.",
    benefits: [
      { icon: "📋", text: "Submit and manage multiple applications" },
      { icon: "🔔", text: "Get instant status updates and notifications" },
      { icon: "📄", text: "Keep your resume and documents organized" },
      { icon: "💼", text: "Connect with employers who match your skills" },
    ],
  },
  admin: {
    badge: "⚙️ Admin Portal",
    heading: "Manage Your Recruitment Pipeline",
    description:
      "Access your dashboard to review candidates, track applications, and streamline your hiring workflow.",
    benefits: [
      { icon: "👥", text: "Review and filter candidate applications" },
      { icon: "📈", text: "Track recruitment metrics and progress" },
      { icon: "📅", text: "Schedule and manage interviews" },
      { icon: "✅", text: "Shortlist and approve top candidates" },
    ],
  },
};

export default function LoginCard({
  loginType,
  title,
  subtitle,
  emailLabel,
  emailPlaceholder,
  buttonText,
  switchText,
  switchHref,
}: Props) {
  const router = useRouter();
  const v = VISUAL[loginType];
  const isAdmin = loginType === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Calls user or admin login API; on success stores token/role and redirects by role. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = isAdmin
        ? await adminLoginRequest(email, password)
        : await userLoginRequest(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      if (data.role === "admin") {
        router.push("/admin-login/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const gradientPanel = isAdmin
    ? "from-indigo-700 to-purple-600"
    : "from-indigo-500 to-purple-400";
  const btnGradient = isAdmin
    ? "from-indigo-700 to-purple-600"
    : "from-purple-400 to-indigo-500";

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Visual Panel */}
      <div
        className={`hidden lg:flex flex-1 bg-linear-to-br ${gradientPanel} p-[60px] flex-col justify-center relative overflow-hidden`}
      >
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="relative z-10 max-w-[500px] mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.18] rounded-[18px] text-white text-[0.8rem] font-semibold mb-5">
            {v.badge}
          </div>
          <h1 className="text-[2.4rem] font-extrabold text-white mb-4 leading-[1.2]">
            {v.heading}
          </h1>
          <p className="text-white/90 text-[1.05rem] leading-[1.7] mb-10">
            {v.description}
          </p>
          {v.benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 py-4 px-5 bg-white/[0.12] rounded-[14px] mb-3.5 border border-white/[0.18]"
            >
              <div className="w-11 h-11 bg-white/[0.18] rounded-[10px] flex items-center justify-center text-[1.2rem] shrink-0">
                {b.icon}
              </div>
              <div className="text-white text-[0.95rem] font-medium">
                {b.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-10 xl:p-[60px] flex flex-col justify-center items-center bg-white">
        <div className="w-full max-w-[420px] min-w-0">
          <div className="mb-8">
            <div className="mb-6 font-extrabold text-2xl flex items-center gap-2 text-[#0f172a]">
              🎯 RecruitPro
            </div>
            {isAdmin && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl text-[0.75rem] font-semibold text-indigo-600 mb-3.5">
                🔐 Admin Portal
              </div>
            )}
            <h2 className="text-[1.8rem] font-bold text-[#0f172a] mb-2">
              {title}
            </h2>
            <p className="text-[#64748b] text-[0.95rem]">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="text-[0.85rem] font-semibold text-[#374151] mb-2 block">
                {emailLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#94a3b8]">
                  ✉️
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholder}
                  required
                  className="w-full py-3.5 pr-3.5 pl-11 border border-[#e2e8f0] rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] text-[#1e293b]"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[0.85rem] font-semibold text-[#374151] mb-2 block">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#94a3b8]">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full py-3.5 px-11 border border-[#e2e8f0] rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] text-[#1e293b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#94a3b8] text-[1.1rem]"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-linear-to-r ${btnGradient} border-none rounded-[14px] text-white font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 mt-2.5 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(99,102,241,0.35)] disabled:opacity-50`}
            >
              {loading ? "Logging in..." : `${buttonText} →`}
            </button>
          </form>

          {/* <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full py-4 bg-linear-to-r from-purple-400 to-indigo-500 border-none rounded-[14px] text-white font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 mt-4 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(99,102,241,0.35)]"
          >
            Continue with Google
          </button> */}

          {!isAdmin && (
            <div className="text-center mt-6">
              <p className="text-sm text-[#64748b]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          )}

          <div className="text-center mt-7 pt-6 border-t border-[#e2e8f0]">
            <Link
              href={switchHref}
              className="text-[#64748b] text-[0.9rem] font-medium transition-colors duration-200 hover:text-indigo-500 no-underline"
            >
              {switchText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
