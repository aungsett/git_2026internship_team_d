import { redirect } from "next/navigation";

/** /applicant/login redirects to the main applicant login page. */
export default function ApplicantLoginAliasPage() {
  redirect("/login");
}
