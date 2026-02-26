import { NextResponse } from "next/server";

const BACKEND_BASE_URL = (
  process.env.BACKEND_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/$/, "");

const BACKEND_LOGIN_URL = `${BACKEND_BASE_URL}/auth/login`;

type LoginBody = {
  email?: string;
  password?: string;
};

type LoginResponse = {
  token?: string;
  role?: string;
  error?: string;
  redirectTo?: string;
  actionText?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const backendRes = await fetch(BACKEND_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const data = (await backendRes.json()) as LoginResponse;

    if (!backendRes.ok) {
      return NextResponse.json({ error: data.error || "User login failed" }, { status: backendRes.status });
    }

    if (!data.token || !data.role) {
      return NextResponse.json({ error: "Invalid login response from backend" }, { status: 502 });
    }

    if (data.role === "admin") {
      return NextResponse.json(
        {
          error: "Admin account detected. Please use the Admin Login page.",
          redirectTo: "/admin-login",
          actionText: "Go to Admin Login",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
