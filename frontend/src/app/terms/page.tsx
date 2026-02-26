export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-black mb-6">
          Terms & Conditions
        </h1>

        <p className="mb-4 text-gray-700">
          Welcome to our application. By creating an account and using our
          services, you agree to the following terms and conditions.
        </p>

        <h2 className="text-xl font-semibold text-black mt-6 mb-2">
          1. Account Responsibility
        </h2>
        <p className="text-gray-700 mb-4">
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account.
        </p>

        <h2 className="text-xl font-semibold text-black mt-6 mb-2">
          2. Acceptable Use
        </h2>
        <p className="text-gray-700 mb-4">
          You agree not to misuse the service, attempt unauthorized access,
          or engage in activities that disrupt the platform.
        </p>

        <h2 className="text-xl font-semibold text-black mt-6 mb-2">
          3. Privacy Policy
        </h2>
        <p className="text-gray-700 mb-4">
          Your personal information is handled according to our privacy
          practices. We do not sell your data to third parties.
        </p>

        <h2 className="text-xl font-semibold text-black mt-6 mb-2">
          4. Termination
        </h2>
        <p className="text-gray-700 mb-4">
          We reserve the right to suspend or terminate accounts that violate
          these terms.
        </p>

        <h2 className="text-xl font-semibold text-black mt-6 mb-2">
          5. Changes to Terms
        </h2>
        <p className="text-gray-700">
          We may update these Terms & Conditions at any time. Continued use
          of the service means you accept the updated terms.
        </p>

        <p className="mt-8 text-sm text-gray-500">
          Last updated: February 2026
        </p>
      </div>
    </div>
  );
}