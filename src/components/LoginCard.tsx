"use client";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 LOGIN HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data =
        loginType === "admin"
          ? await adminLoginRequest(email, password)
          : await userLoginRequest(email, password);

      // Save token + role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      // Redirect based on role
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{ color: "black", backgroundColor: "white" }}
      className="w-full max-w-md rounded-2xl p-8 shadow-md"
    >
      {/* TITLE */}
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1 mb-6">{subtitle}</p>

      {/* EMAIL */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {emailLabel}
        </label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">📧</span>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            required
            className="w-full border border-black rounded-lg pl-10 pr-4 py-3 focus:outline-none"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Password
        </label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">🔒</span>

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            className="w-full border border-black rounded-lg pl-10 pr-10 py-3 focus:outline-none"
          />

          {/* SHOW / HIDE PASSWORD */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? "👁" : "🙈"}
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
      )}

      {/* LOGIN BUTTON */}
      <button
        type="submit"
        disabled={loading}
        style={{
          background: "linear-gradient(135deg, #a78bfa, #6366f1)",
          color: "white",
        }}
        className="w-full py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? "Logging in..." : buttonText}
      </button>

       <button
  type="button"
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
  style={{
    background: "linear-gradient(135deg, #a78bfa, #6366f1)",
    color: "white",
  }}
  className="w-full py-3 rounded-lg font-semibold mt-4"
>
  Continue with Google
</button>

      {/* BOTTOM LINKS */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <Link
          href={switchHref}
          className="text-gray-700 hover:text-indigo-600 transition"
        >
          {switchText}
        </Link>
      </div>
    </form>
  );
}
