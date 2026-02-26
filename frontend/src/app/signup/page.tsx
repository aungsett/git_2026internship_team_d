"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    if (!success) {
      return;
    }

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
      await registerRequest(
        form.fullName,
        form.email,
        form.password
      );

      setSuccess(true);
      setSuccessVisible(false);

      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";

      if (message.toLowerCase().includes("exist")) {
        setAccountExists(true);

        setTimeout(() => {
          setAccountExists(false);
        }, 3000);
      } else {
        alert(message);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen bg-gray-100">

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
              successVisible ? "scale-100 translate-y-0 opacity-100" : "scale-95 -translate-y-1 opacity-0"
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✅
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Account Created!</h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Redirecting to Login...</p>
          </div>
        </div>
      )}

      <div className="flex min-h-screen items-center justify-center px-4 py-8">

        {/* ✅ ACCOUNT EXISTS POPUP */}
        {accountExists && (
          <div className="fixed right-5 top-5 z-40 rounded-lg bg-red-500 px-6 py-3 text-white shadow-lg">
            ⚠️ Account already exists.
            <span
              onClick={() => router.push("/login")}
              className="ml-2 cursor-pointer font-semibold underline"
            >
              Login here
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="text-center text-3xl font-bold text-black">
            Create Your Account
          </h1>
          <p className="mb-6 text-center text-gray-500">
            Fill in your details to get started
          </p>

          <Input
            icon="👤"
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            className="text-black placeholder-gray-400"
          />

          <Input
            icon="📧"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            className="text-black placeholder-gray-400"
          />

          <div className="relative">
            <Input
              icon="🔒"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create Password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              className="text-black placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-black"
            >
              👁
            </button>
          </div>

          <div className="relative">
            <Input
              icon="🔒"
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Re-enter Password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              className="text-black placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-4 text-black"
            >
              👁
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={agree}
              onChange={() => setAgree(!agree)}
            />
            <span className="text-sm text-black">
              I agree to{" "}
              <a
                href="/terms"
                target="_blank"
                className="text-indigo-600 underline"
              >
                Terms of Service & Privacy Policy
              </a>
            </span>
          </div>

          {errors.agree && (
            <p className="text-sm text-red-500">{errors.agree}</p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-purple-400 to-indigo-500 py-3 font-semibold text-white"
          >
            Create Account →
          </button>

          <p className="mt-6 text-center text-sm text-black">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              className="cursor-pointer text-indigo-600"
            >
              Sign in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

function Input({
  icon,
  error,
  className = "",
  ...props
}: {
  icon: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full mt-4">
      <div className="flex items-center border rounded-lg px-3">
        <span className="mr-2">{icon}</span>
        <input
          {...props}
          className={`w-full py-3 outline-none ${className}`}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}