import LoginCard from "@/components/LoginCard";

/** Admin login page: uses LoginCard with admin flow and link back to applicant login. */
export default function AdminLogin() {
  return (
    <LoginCard
      loginType="admin"
      title="Admin Login"
      subtitle="Sign in to access your dashboard"
      emailLabel="Admin Email"
      emailPlaceholder="admin@company.com"
      buttonText="Access Dashboard"
      switchText="← Applicant Login"
      switchHref="/login"
    />
  );
}
