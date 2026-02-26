import LoginCard from "@/components/LoginCard";

export default function ApplicantLogin() {
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
        <LoginCard
          loginType="user"
          title="Applicant Login"
          subtitle="Sign in to your account"
          emailLabel="Email Address"
          emailPlaceholder="you@email.com"
          buttonText="Continue"
          switchText="Admin Login →"
          switchHref="/admin-login"
        />
      </div>
    </main>
  );
}
