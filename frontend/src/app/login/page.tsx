import LoginCard from "@/components/LoginCard";

/** Applicant login page: uses LoginCard with user flow and link to admin login. */
export default function ApplicantLogin() {
  return (
    <LoginCard
      loginType="user"
      title="Applicant Login"
      subtitle="Sign in or create your account"
      emailLabel="Email Address"
      emailPlaceholder="you@email.com"
      buttonText="Continue"
      switchText="Admin Login →"
      switchHref="/admin-login"
    />
  );
}
