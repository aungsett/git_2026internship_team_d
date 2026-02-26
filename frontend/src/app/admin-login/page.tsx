import LoginCard from "@/components/LoginCard";

export default function AdminLogin() {
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
        <LoginCard
          loginType="admin"
          title="Admin Login"
          subtitle="Sign in to the admin portal"
          emailLabel="Admin Email"
          emailPlaceholder="admin@company.com"
          buttonText="Login"
          switchText="Applicant Login →"
          switchHref="/login"
        />
      </div>
    </main>
  );
}
