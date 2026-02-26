const API_URL = "http://localhost:5000/api/v1";

type LoginResponse = {
  token: string;
  role: string;
};

type LoginErrorResponse = {
  error?: string;
  redirectTo?: string;
  actionText?: string;
};

export class LoginApiError extends Error {
  redirectTo?: string;
  actionText?: string;

  constructor(message: string, redirectTo?: string, actionText?: string) {
    super(message);
    this.name = "LoginApiError";
    this.redirectTo = redirectTo;
    this.actionText = actionText;
  }
}


async function loginByPath(path: string, email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as LoginResponse | LoginErrorResponse;

  if (!res.ok) {
    const errorData = data as LoginErrorResponse;
    throw new LoginApiError(
      errorData.error || "Login failed",
      errorData.redirectTo,
      errorData.actionText
    );
  }

  return data as LoginResponse;
}

export async function userLoginRequest(email: string, password: string) {
  return loginByPath("/api/login/user", email, password);
}

export async function adminLoginRequest(email: string, password: string) {
  return loginByPath("/api/login/admin", email, password);
}


export async function registerRequest(
  full_name: string,
  email: string,
  password: string
) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ full_name, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}
