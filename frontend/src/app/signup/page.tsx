"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerRequest } from "../lib/apis";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agree?: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [success, setSuccess] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!success) return;

    const animateIn = window.requestAnimationFrame(() => {
      setSuccessVisible(true);
    });

    const timer = window.setTimeout(() => {
      router.push("/applicant/login");
    }, 3000);

    return () => {
      window.cancelAnimationFrame(animateIn);
      window.clearTimeout(timer);
    };
  }, [success, router]);

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim())
      newErrors.fullName = "Full name is required";

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Invalid email format";

    if (
      !form.password.match(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
      )
    )
      newErrors.password =
        "Password must be 8+ chars, include uppercase, number & symbol";

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!agree)
      newErrors.agree = "You must accept Terms of Service & Privacy Policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await registerRequest(form.fullName, form.email, form.password);

      setSuccess(true);
      setSuccessVisible(false);

      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";

      if (message.toLowerCase().includes("exist")) {
        setAccountExists(true);
        setTimeout(() => setAccountExists(false), 3000);
      } else {
        alert(message);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Visual Panel */}
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-purple-500 to-indigo-500 p-[60px] flex-col justify-center relative overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="relative z-10 max-w-[500px] mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.18] rounded-[18px] text-white text-[0.8rem] font-semibold mb-5">
            🚀 Get Started
          </div>
          <h1 className="text-[2.4rem] font-extrabold text-white mb-4 leading-[1.2]">
            Create Your Account
          </h1>
          <p className="text-white/90 text-[1.05rem] leading-[1.7] mb-10">
            Join RecruitPro to apply for courses, track your applications, and
            connect with top employers.
          </p>
          <div className="flex items-center gap-3.5 py-4 px-5 bg-white/[0.12] rounded-[14px] mb-3.5 border border-white/[0.18]">
            <div className="w-11 h-11 bg-white/[0.18] rounded-[10px] flex items-center justify-center text-[1.2rem] shrink-0">
              ✨
            </div>
            <div className="text-white text-[0.95rem] font-medium">
              Quick and easy registration process
            </div>
          </div>
          <div className="flex items-center gap-3.5 py-4 px-5 bg-white/[0.12] rounded-[14px] mb-3.5 border border-white/[0.18]">
            <div className="w-11 h-11 bg-white/[0.18] rounded-[10px] flex items-center justify-center text-[1.2rem] shrink-0">
              🔒
            </div>
            <div className="text-white text-[0.95rem] font-medium">
              Your data is secure and private
            </div>
          </div>
          <div className="flex items-center gap-3.5 py-4 px-5 bg-white/[0.12] rounded-[14px] mb-3.5 border border-white/[0.18]">
            <div className="w-11 h-11 bg-white/[0.18] rounded-[10px] flex items-center justify-center text-[1.2rem] shrink-0">
              📊
            </div>
            <div className="text-white text-[0.95rem] font-medium">
              Track applications in real time
            </div>
          </div>
          <div className="flex items-center gap-3.5 py-4 px-5 bg-white/[0.12] rounded-[14px] mb-3.5 border border-white/[0.18]">
            <div className="w-11 h-11 bg-white/[0.18] rounded-[10px] flex items-center justify-center text-[1.2rem] shrink-0">
              🎯
            </div>
            <div className="text-white text-[0.95rem] font-medium">
              Get matched with the right courses
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-10 xl:p-[60px] flex flex-col justify-center items-center bg-white relative">
        {success && (
          <div
            className={`fixed right-5 top-5 z-50 transition-all duration-300 ${
              successVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              role="status"
              aria-live="polite"
              className={`w-[min(92vw,24rem)] rounded-2xl bg-white p-6 text-center shadow-xl transition-all duration-300 ${
                successVisible
                  ? "scale-100 translate-y-0 opacity-100"
                  : "scale-95 -translate-y-1 opacity-0"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
                ✅
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#0f172a]">
                Account Created!
              </h2>
              <p className="mt-2 text-sm text-[#64748b]">
                Redirecting to Login...
              </p>
            </div>
          </div>
        )}

        {accountExists && (
          <div className="fixed right-5 top-5 z-40 rounded-xl bg-red-500 px-6 py-3 text-white shadow-lg">
            ⚠️ Account already exists.
            <span
              onClick={() => router.push("/login")}
              className="ml-2 cursor-pointer font-semibold underline"
            >
              Login here
            </span>
          </div>
        )}

        <div className="w-full max-w-[420px] min-w-0 px-1">
          <div className="mb-8">
            <div className="mb-6 font-extrabold text-2xl flex items-center gap-2 text-[#0f172a]">
              🎯 RecruitPro
            </div>
            <h2 className="text-[1.8rem] font-bold text-[#0f172a] mb-2">
              Create Your Account
            </h2>
            <p className="text-[#64748b] text-[0.95rem]">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="text-[0.85rem] font-semibold text-[#374151] mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#94a3b8]">
                  👤
                </span>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full py-3.5 pr-3.5 pl-11 border border-[#e2e8f0] rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] text-[#1e293b]"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[0.85rem] font-semibold text-[#374151] mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#94a3b8]">
                  ✉️
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@email.com"
                  className="w-full py-3.5 pr-3.5 pl-11 border border-[#e2e8f0] rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] text-[#1e293b]"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[0.85rem] font-semibold text-[#374151] mb-2 block">
                Create Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#94a3b8]">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create Password"
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[0.85rem] font-semibold text-[#374151] mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[1.1rem] text-[#94a3b8]">
                  🔒
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter Password"
                  className="w-full py-3.5 px-11 border border-[#e2e8f0] rounded-xl text-[0.95rem] outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] text-[#1e293b]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#94a3b8] text-[1.1rem]"
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={() => setAgree(!agree)}
                className="w-5 h-5 accent-indigo-500"
              />
              <span className="text-sm text-[#64748b]">
                I agree to{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-indigo-600 underline"
                >
                  Terms of Service & Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agree && (
              <p className="text-red-500 text-xs mt-1">{errors.agree}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-linear-to-r from-purple-400 to-indigo-500 border-none rounded-[14px] text-white font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 mt-6 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(99,102,241,0.35)]"
            >
              Create Account →
            </button>
          </form>

          <div className="text-center mt-7 pt-6 border-t border-[#e2e8f0]">
            <p className="text-sm text-[#64748b]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
