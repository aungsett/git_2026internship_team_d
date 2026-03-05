"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  getCourses,
  submitApplication,
  type ApplicationFormData,
  type SubmitApplicationResponse,
} from "../../lib/apis";

type Course = { course_id: number; course_name: string; course_level: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PROFESSIONAL_SUMMARY_MAX = 500;
const FULL_NAME_MIN = 2;
const FULL_NAME_MAX = 100;
const YEARS_EXPERIENCE_MAX = 40;

// Practical RFC 5322-style email validation (covers common valid formats)
function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

const defaultForm: ApplicationFormData = {
  phone_number: "",
  location: "",
  date_of_birth: "",
  highest_degree: "",
  field_of_study: "",
  university: "",
  graduation_year: "",
  gpa_percentage: "",
  years_experience: "",
  current_job_title: "",
  company_name: "",
  industry: "",
  professional_summary: "",
  course_id: "",
};

const DEGREE_OPTIONS = ["High School", "Bachelor's", "Master's", "PhD"];

const COURSE_SCHEDULE_OPTIONS = [
  { value: "", label: "Select your preferred schedule" },
  { value: "Weekday night", label: "Weekday night" },
  { value: "Weekend", label: "Weekend" },
];

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Government",
  "Non-profit",
  "Other",
];

const STEP_LABELS = [
  "Personal Info",
  "Education",
  "Experience",
  "Course",
  "Documents",
  "Review",
];
const TOTAL_STEPS = 6;

function currentYear(): number {
  return new Date().getFullYear();
}
function graduationYears(): number[] {
  const end = currentYear() + 2;
  const arr: number[] = [];
  for (let y = 1950; y <= end; y++) arr.push(y);
  return arr.reverse();
}

export default function ApplicantApplyPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<ApplicationFormData>(defaultForm);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [applicationRef, setApplicationRef] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [agree, setAgree] = useState(false);
  const [email, setEmail] = useState("");
  const [courseSchedule, setCourseSchedule] = useState("");
  const [hasExperience, setHasExperience] = useState<boolean | null>(null);
  const [industryOther, setIndustryOther] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const graduationYearOptions = useMemo(() => graduationYears(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    getCourses()
      .then(setCourses)
      .catch(() => setError("Failed to load courses."));
  }, [mounted, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = (step: number): boolean => {
    setError("");
    const errors: Record<string, string> = {};

    if (step === 1) {
      const name = (form.full_name || "").trim();
      if (name.length < FULL_NAME_MIN)
        errors.full_name = "Name must be at least 2 characters";
      else if (name.length > FULL_NAME_MAX)
        errors.full_name = "Name must be at most 100 characters";
      if (!email.trim()) errors.email = "Email address is required.";
      else if (!isValidEmail(email))
        errors.email = "Please enter a valid email address";
      if (!form.phone_number?.trim())
        errors.phone_number = "Phone number is required.";
      if (!form.location?.trim())
        errors.location = "Current location is required.";
      if (!form.date_of_birth) errors.date_of_birth = "Date of birth is required.";
      else {
        const d = new Date(form.date_of_birth + "T00:00:00");
        if (d > new Date())
          errors.date_of_birth = "Date of birth cannot be in the future";
        else if (d.getFullYear() < 1900)
          errors.date_of_birth = "Please enter a valid date of birth";
      }
    }

    if (step === 2) {
      if (!form.highest_degree)
        errors.highest_degree = "Please select your highest degree.";
      if (!form.field_of_study?.trim())
        errors.field_of_study = "Field of study is required.";
      if (!form.university?.trim())
        errors.university = "University / Institution is required.";
      if (!form.graduation_year)
        errors.graduation_year = "Graduation year is required.";
      else {
        const y = parseInt(form.graduation_year, 10);
        if (y < 1950 || y > currentYear() + 2)
          errors.graduation_year = "Please select a valid graduation year (1950 to " + (currentYear() + 2) + ").";
      }
      const gpa = form.gpa_percentage?.trim();
      if (gpa) {
        const num = parseFloat(gpa);
        if (isNaN(num) || num < 0 || num > 100)
          errors.gpa_percentage = "GPA/Percentage must be between 0 and 100.";
      }
    }

    if (step === 3) {
      if (hasExperience === null)
        errors.has_experience = "Please select whether you have professional experience.";
      if (hasExperience === true) {
        const yrs = form.years_experience?.trim();
        if (yrs === "" || yrs == null)
          errors.years_experience = "Years of experience is required when you have experience.";
        else {
          const n = parseInt(yrs, 10);
          if (isNaN(n) || n < 0 || n > YEARS_EXPERIENCE_MAX)
            errors.years_experience = `Years of experience must be between 0 and ${YEARS_EXPERIENCE_MAX}.`;
        }
      }
      const summary = (form.professional_summary || "").trim();
      if (summary.length > PROFESSIONAL_SUMMARY_MAX)
        errors.professional_summary = `Summary must not exceed ${PROFESSIONAL_SUMMARY_MAX} characters.`;
    }

    if (step === 4) {
      if (!courseSchedule)
        errors.course_schedule = "Please select your preferred Japanese Language course schedule.";
      if (!form.course_id && courses.length > 0)
        errors.course_id = "Please select a course.";
    }

    if (step === 5) {
      if (!cvFile) errors.cv_file = "Please upload your resume (CV upload is mandatory).";
      else if (cvFile.size > MAX_FILE_SIZE)
        errors.cv_file = "File size must not exceed 5MB.";
    }

    if (step === 6) {
      if (!agree)
        errors.agree =
          "You must agree to the Terms of Service and Privacy Policy.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const allStepsValid = useMemo(() => {
    const name = (form.full_name || "").trim();
    if (name.length < FULL_NAME_MIN || name.length > FULL_NAME_MAX) return false;
    if (!email.trim() || !isValidEmail(email)) return false;
    if (!form.phone_number?.trim() || !form.location?.trim()) return false;
    if (!form.date_of_birth) return false;
    const d = new Date(form.date_of_birth + "T00:00:00");
    if (d > new Date() || d.getFullYear() < 1900) return false;

    if (!form.highest_degree || !form.field_of_study?.trim() || !form.university?.trim() || !form.graduation_year) return false;
    const gpa = form.gpa_percentage?.trim();
    if (gpa && (parseFloat(gpa) < 0 || parseFloat(gpa) > 100)) return false;

    if (hasExperience === null) return false;
    if (hasExperience === true) {
      const yrs = form.years_experience?.trim();
      if (!yrs) return false;
      const n = parseInt(yrs, 10);
      if (isNaN(n) || n < 0 || n > YEARS_EXPERIENCE_MAX) return false;
    }
    if ((form.professional_summary || "").length > PROFESSIONAL_SUMMARY_MAX) return false;

    if (!courseSchedule) return false;

    if (!cvFile || cvFile.size > MAX_FILE_SIZE) return false;

    if (!agree) return false;

    return true;
  }, [form, email, courseSchedule, cvFile, agree, hasExperience]);

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    setError("");
    setFieldErrors({});
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFieldErrors((prev) => ({
          ...prev,
          cv_file: "File size must not exceed 5MB.",
        }));
        setCvFile(null);
        setUploadProgress(0);
        return;
      }
      setFieldErrors((prev) => ({ ...prev, cv_file: "" }));
      setUploadProgress(0);
      const t = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 100));
      }, 80);
      setTimeout(() => {
        clearInterval(t);
        setUploadProgress(100);
        setCvFile(file);
      }, 500);
    } else {
      setCvFile(null);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(6)) return;
    setError("");
    setLoading(true);
    try {
      const industryValue =
        form.industry === "Other" ? industryOther.trim() || "Other" : form.industry;
      const summary = (form.professional_summary || "").slice(0, PROFESSIONAL_SUMMARY_MAX);
      const payload: ApplicationFormData = {
        ...form,
        phone_number: form.phone_number || "",
        location: form.location || "",
        field_of_study: form.field_of_study || "",
        university: form.university || "",
        graduation_year: form.graduation_year || String(currentYear()),
        gpa_percentage:
          form.gpa_percentage?.trim() === ""
            ? "0"
            : form.gpa_percentage || "0",
        years_experience:
          hasExperience === true && form.years_experience?.trim() !== ""
            ? form.years_experience
            : "0",
        current_job_title: form.current_job_title || "",
        company_name: form.company_name || "",
        industry: industryValue || "",
        professional_summary: summary,
        course_id: form.course_id || (courses[0] ? String(courses[0].course_id) : ""),
        course_schedule: courseSchedule || "",
        cv_file: cvFile || undefined,
      };
      const data = await submitApplication(payload) as SubmitApplicationResponse;
      setApplicationRef(data.application_ref || `APP-${currentYear()}-${String(data.application_id).padStart(5, "0")}`);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("numeric") || msg.includes("syntax")
          ? "Please check that all required fields have valid values and try again."
          : msg || "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#64748b]">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-md border border-[#f1f5f9]">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#0f172a]">
            Application submitted
          </h2>
          <p className="text-[#64748b] mt-2">
            Your application reference: <strong className="text-[#0f172a]">{applicationRef}</strong>
          </p>
          <p className="text-[#64748b] mt-3">
            We will review your application within 5-7 business days.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/applicant/apply"
              className="inline-block py-3 px-6 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 no-underline"
            >
              Submit another application
            </Link>
            <Link
              href="/dashboard"
              className="inline-block py-3 px-6 border-2 border-[#e2e8f0] text-[#1e293b] font-semibold rounded-xl hover:bg-[#f8fafc] no-underline"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen text-[#1e293b]">
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 bg-white/95 backdrop-blur-xl border-b border-[#e2e8f0]">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 text-lg sm:text-xl font-bold text-[#1e293b] no-underline shrink-0">
          <span className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-cyan-200 to-purple-300 rounded-xl flex items-center justify-center text-base sm:text-lg">
            🎯
          </span>
          <span>RecruitPro</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/applicant/apply" className="text-indigo-500 text-sm sm:text-base font-medium no-underline py-2">
            Apply
          </Link>
          <Link href="/dashboard" className="text-[#64748b] text-sm sm:text-base font-medium no-underline hover:text-[#1e293b] py-2">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="pt-[88px] sm:pt-[100px] lg:pt-[120px] pb-10 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-12 max-w-[900px] mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-linear-to-br from-purple-200 to-purple-300 text-purple-800 rounded-[16px] sm:rounded-[20px] text-[0.75rem] sm:text-[0.85rem] font-semibold mb-3 sm:mb-4">
            Application Form
          </span>
          <h1 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-extrabold mb-2 sm:mb-3 text-[#0f172a]">
            Start Your Journey
          </h1>
          <p className="text-[#64748b] text-[0.95rem] sm:text-[1.1rem] max-w-[500px] mx-auto leading-relaxed px-1">
            Complete the form below to apply for our programs. We&apos;ll review
            your application and get back to you within 5-7 business days.
          </p>
        </div>

        <div className="sticky top-[56px] sm:top-[64px] z-40 -mx-4 sm:-mx-6 lg:-mx-12 px-4 sm:px-6 lg:px-12 pt-2 pb-3 sm:pb-4 mb-6 sm:mb-8 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <div className="max-w-[900px] mx-auto">
            <div className="h-1.5 bg-[#e2e8f0] rounded-[3px] mb-3 sm:mb-4 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-400 to-indigo-500 rounded-[3px] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center gap-1 min-w-0">
              {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <div key={stepNum} className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-center">
                    <span
                      className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold shrink-0 ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isCurrent
                            ? "bg-indigo-500 text-white"
                            : "bg-[#e2e8f0] text-[#94a3b8]"
                      }`}
                    >
                      {isDone ? "✓" : stepNum}
                    </span>
                    <span
                      className={`text-[0.7rem] sm:text-[0.85rem] font-medium truncate hidden min-[480px]:inline ${
                        isDone
                          ? "text-green-600"
                          : isCurrent
                            ? "text-indigo-600"
                            : "text-[#94a3b8]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <form
          id="applicationForm"
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 lg:p-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.05)]"
        >
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Personal Information (FR2.1.2) */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <span className="w-10 h-10 bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-[0.9rem] shrink-0">
                  01
                </span>
                <div>
                  <h3 className="text-[1.15rem] font-bold mb-1">Personal Information</h3>
                  <p className="text-[0.9rem] text-[#64748b]">All fields marked with * are required</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="Full Name"
                  required
                  name="full_name"
                  value={form.full_name || ""}
                  onChange={handleChange}
                  placeholder="Enter your full name (2-100 characters)"
                  error={fieldErrors.full_name}
                />
                <FormField
                  label="Email Address"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="your.email@example.com"
                  error={fieldErrors.email}
                />
                <FormField
                  label="Phone Number"
                  required
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+91 (555) 123-4567"
                  error={fieldErrors.phone_number}
                />
                <FormField
                  label="Current Location"
                  required
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  error={fieldErrors.location}
                />
                <FormField
                  label="Date of Birth"
                  required
                  name="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  error={fieldErrors.date_of_birth}
                />
              </div>
            </div>
          )}

          {/* Step 2: Educational Background (FR2.1.3) */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <span className="w-10 h-10 bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-[0.9rem] shrink-0">
                  02
                </span>
                <div>
                  <h3 className="text-[1.15rem] font-bold mb-1">Educational Background</h3>
                  <p className="text-[0.9rem] text-[#64748b]">Your academic details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-[0.9rem] font-semibold text-[#374151] mb-2">
                    Highest Degree <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="highest_degree"
                    value={form.highest_degree}
                    onChange={handleChange}
                    className={`py-3.5 px-[18px] bg-[#f8fafc] border-2 rounded-xl text-[0.95rem] outline-none transition-all ${fieldErrors.highest_degree ? "border-red-400" : "border-[#e2e8f0]"}`}
                  >
                    <option value="">Select degree</option>
                    {DEGREE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {fieldErrors.highest_degree && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.highest_degree}</p>
                  )}
                </div>
                <FormField
                  label="Field of Study"
                  required
                  name="field_of_study"
                  value={form.field_of_study}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  error={fieldErrors.field_of_study}
                />
                <FormField
                  label="University / Institution"
                  required
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="Institution name"
                  error={fieldErrors.university}
                />
                <div className="flex flex-col">
                  <label className="text-[0.9rem] font-semibold text-[#374151] mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="graduation_year"
                    value={form.graduation_year}
                    onChange={handleChange}
                    className={`py-3.5 px-[18px] bg-[#f8fafc] border-2 rounded-xl text-[0.95rem] outline-none transition-all ${fieldErrors.graduation_year ? "border-red-400" : "border-[#e2e8f0]"}`}
                  >
                    <option value="">Select year</option>
                    {graduationYearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {fieldErrors.graduation_year && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.graduation_year}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    label="GPA / Percentage (Optional)"
                    name="gpa_percentage"
                    type="number"
                    value={form.gpa_percentage}
                    onChange={handleChange}
                    placeholder="0-100 or 0-10"
                    error={fieldErrors.gpa_percentage}
                  />
                  <p className="text-[0.8rem] text-[#64748b] mt-1">Optional. Enter 0-100 for percentage or 0-10 for GPA.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Professional Experience (FR2.1.4) */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <span className="w-10 h-10 bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-[0.9rem] shrink-0">
                  03
                </span>
                <div>
                  <h3 className="text-[1.15rem] font-bold mb-1">Professional Experience</h3>
                  <p className="text-[0.9rem] text-[#64748b]">If you have relevant experience</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-[0.9rem] font-semibold text-[#374151] mb-2 block">
                    Do you have professional experience? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="has_experience"
                        checked={hasExperience === true}
                        onChange={() => { setHasExperience(true); setFieldErrors((prev) => ({ ...prev, has_experience: "" })); }}
                        className="w-5 h-5 accent-indigo-500"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="has_experience"
                        checked={hasExperience === false}
                        onChange={() => { setHasExperience(false); setFieldErrors((prev) => ({ ...prev, has_experience: "" })); }}
                        className="w-5 h-5 accent-indigo-500"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {fieldErrors.has_experience && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.has_experience}</p>
                  )}
                </div>
                {hasExperience === true && (
                  <>
                    <div className="flex flex-col">
                      <label className="text-[0.9rem] font-semibold text-[#374151] mb-2">
                        Years of Experience <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="years_experience"
                        min={0}
                        max={YEARS_EXPERIENCE_MAX}
                        value={form.years_experience}
                        onChange={handleChange}
                        className={`py-3.5 px-[18px] bg-[#f8fafc] border-2 rounded-xl text-[0.95rem] ${fieldErrors.years_experience ? "border-red-400" : "border-[#e2e8f0]"}`}
                      />
                      <p className="text-[0.8rem] text-[#64748b] mt-1">
                        {(form.years_experience || "").length > 0 ? form.years_experience : "0"}/{YEARS_EXPERIENCE_MAX}
                      </p>
                      {fieldErrors.years_experience && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.years_experience}</p>
                      )}
                    </div>
                    <FormField
                      label="Current Job Title (Optional)"
                      name="current_job_title"
                      value={form.current_job_title}
                      onChange={handleChange}
                      placeholder="Job title"
                    />
                    <FormField
                      label="Company Name (Optional)"
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="Company"
                    />
                    <div className="sm:col-span-2">
                      <label className="text-[0.9rem] font-semibold text-[#374151] mb-2 block">
                        Industry (Optional)
                      </label>
                      <select
                        name="industry"
                        value={form.industry}
                        onChange={handleChange}
                        className="py-3.5 px-[18px] bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-[0.95rem] w-full"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {form.industry === "Other" && (
                        <input
                          type="text"
                          value={industryOther}
                          onChange={(e) => setIndustryOther(e.target.value)}
                          placeholder="Specify other industry"
                          className="mt-2 py-3 px-[18px] bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-[0.95rem] w-full"
                        />
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[0.9rem] font-semibold text-[#374151] mb-2 block">
                        Professional Summary (Optional, max {PROFESSIONAL_SUMMARY_MAX} characters)
                      </label>
                      <textarea
                        name="professional_summary"
                        value={form.professional_summary}
                        onChange={handleChange}
                        rows={4}
                        maxLength={PROFESSIONAL_SUMMARY_MAX + 1}
                        placeholder="Brief summary of your experience..."
                        className={`w-full py-3.5 px-[18px] bg-[#f8fafc] border-2 rounded-xl text-[0.95rem] resize-y ${fieldErrors.professional_summary ? "border-red-400" : "border-[#e2e8f0]"}`}
                      />
                      <p className="text-[0.8rem] text-[#64748b] mt-1">
                        {(form.professional_summary || "").length}/{PROFESSIONAL_SUMMARY_MAX}
                      </p>
                      {fieldErrors.professional_summary && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.professional_summary}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Course Preference (FR2.1.5) */}
          {currentStep === 4 && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <span className="w-10 h-10 bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-[0.9rem] shrink-0">
                  04
                </span>
                <div>
                  <h3 className="text-[1.15rem] font-bold mb-1">Course Preference</h3>
                  <p className="text-[0.9rem] text-[#64748b]">Preferred Japanese Language Course</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-[0.9rem] font-semibold text-[#374151] mb-2 block">
                    Preferred Japanese Language Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseSchedule}
                    onChange={(e) => {
                      setCourseSchedule(e.target.value);
                      if (fieldErrors.course_schedule) setFieldErrors((prev) => ({ ...prev, course_schedule: "" }));
                    }}
                    className={`w-full py-3.5 px-[18px] bg-[#f8fafc] border-2 rounded-xl text-[0.95rem] ${fieldErrors.course_schedule ? "border-red-400" : "border-[#e2e8f0]"}`}
                  >
                    {COURSE_SCHEDULE_OPTIONS.map((opt) => (
                      <option key={opt.value || "ph"} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {fieldErrors.course_schedule && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.course_schedule}</p>
                  )}
                </div>
                {courses.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="text-[0.9rem] font-semibold text-[#374151] mb-2 block">
                      Program (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {courses.map((c) => (
                        <label key={c.course_id} className="cursor-pointer">
                          <input
                            type="radio"
                            name="course_id"
                            value={String(c.course_id)}
                            checked={form.course_id === String(c.course_id)}
                            onChange={handleChange}
                            className="hidden"
                          />
                          <span
                            className={`block py-3 px-5 rounded-[25px] text-[0.9rem] font-medium border-2 transition-all ${
                              form.course_id === String(c.course_id)
                                ? "bg-purple-100 border-purple-400 text-purple-800"
                                : "bg-[#f1f5f9] border-transparent text-[#475569] hover:bg-[#e2e8f0]"
                            }`}
                          >
                            {c.course_name} ({c.course_level})
                          </span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.course_id && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.course_id}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: CV Upload (FR2.1.6) */}
          {currentStep === 5 && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <span className="w-10 h-10 bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-[0.9rem] shrink-0">
                  05
                </span>
                <div>
                  <h3 className="text-[1.15rem] font-bold mb-1">Upload CV/Resume</h3>
                  <p className="text-[0.9rem] text-[#64748b]">PDF, DOC, DOCX. Max 5MB. Mandatory.</p>
                </div>
              </div>
              <label
                className={`relative block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  fieldErrors.cv_file ? "border-red-400 bg-red-50/50" : "border-[#cbd5e1] hover:border-purple-400 hover:bg-[#faf5ff]"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center text-3xl">
                  📎
                </div>
                <p className="mb-2 text-[#374151]">
                  <strong>{cvFile ? cvFile.name : "Drop your file here"}</strong>
                  {!cvFile && " or click to browse"}
                </p>
                {cvFile && (
                  <p className="text-[0.85rem] text-[#64748b]">
                    {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3 h-2 bg-[#e2e8f0] rounded-full overflow-hidden max-w-xs mx-auto">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <span className="text-[0.85rem] text-[#94a3b8] block mt-2">Supports PDF, DOC, DOCX. Max 5MB.</span>
              </label>
              {fieldErrors.cv_file && (
                <p className="text-red-500 text-sm mt-2">{fieldErrors.cv_file}</p>
              )}
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div>
              <div className="flex items-start gap-4 mb-8">
                <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  ✓
                </span>
                <div>
                  <h3 className="text-[1.25rem] font-bold text-[#0f172a] mb-1">Review Your Application</h3>
                  <p className="text-[0.95rem] text-[#64748b]">Verify all information before submitting</p>
                </div>
              </div>

              <div className="mb-6 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-[1rem] font-bold text-[#0f172a]">Personal Information</h4>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-indigo-500 font-semibold text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReviewField label="Full Name" value={form.full_name || "—"} />
                  <ReviewField label="Email" value={email || "—"} />
                  <ReviewField label="Phone" value={form.phone_number || "—"} />
                  <ReviewField label="Current Location" value={form.location || "—"} />
                  <ReviewField label="Date of Birth" value={form.date_of_birth ? formatReviewDate(form.date_of_birth) : "—"} />
                </div>
              </div>

              <div className="mb-6 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-[1rem] font-bold text-[#0f172a]">Education</h4>
                  <button type="button" onClick={() => setCurrentStep(2)} className="text-indigo-500 font-semibold text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReviewField label="Highest Degree" value={form.highest_degree || "—"} />
                  <ReviewField label="Field of Study" value={form.field_of_study || "—"} />
                  <ReviewField label="University" value={form.university || "—"} />
                  <ReviewField label="Graduation Year" value={form.graduation_year || "—"} />
                  <ReviewField label="GPA / %" value={form.gpa_percentage ? form.gpa_percentage : "—"} />
                </div>
              </div>

              <div className="mb-6 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-[1rem] font-bold text-[#0f172a]">Experience & Course</h4>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-indigo-500 font-semibold text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReviewField
                    label="Professional experience"
                    value={hasExperience === true ? `Yes, ${form.years_experience || "0"} years` : hasExperience === false ? "No" : "—"}
                  />
                  <ReviewField label="Course schedule" value={courseSchedule || "—"} />
                  <ReviewField
                    label="Program"
                    value={courses.find((c) => String(c.course_id) === form.course_id)?.course_name ?? "—"}
                  />
                </div>
              </div>

              <div className="mb-6 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[1rem] font-bold text-[#0f172a]">Documents</h4>
                  <button type="button" onClick={() => setCurrentStep(5)} className="text-indigo-500 font-semibold text-sm hover:underline">
                    Edit
                  </button>
                </div>
                <ReviewField
                  label="Resume / CV"
                  value={cvFile ? `${cvFile.name} (${(cvFile.size / 1024 / 1024).toFixed(2)} MB)` : "—"}
                />
              </div>

              <div className="mb-6">
                <label className="text-[0.9rem] font-semibold text-[#374151] mb-2 block">
                  I agree to the Terms of Service and Privacy Policy <span className="text-red-500">*</span>
                </label>
                <label className="flex items-start sm:items-center gap-2.5 text-[0.9rem] text-[#64748b] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={() => {
                      setAgree(!agree);
                      if (fieldErrors.agree) setFieldErrors((prev) => ({ ...prev, agree: "" }));
                    }}
                    className="w-5 h-5 mt-0.5 sm:mt-0 shrink-0 accent-indigo-500"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium underline hover:text-indigo-700">
                      Terms of Service & Privacy Policy
                    </Link>
                  </span>
                </label>
                {fieldErrors.agree && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.agree}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center pt-6 sm:pt-8 border-t border-[#e2e8f0] gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handlePrev}
              className={`py-3 px-5 sm:px-6 rounded-xl font-semibold border-2 border-[#e2e8f0] bg-white text-indigo-500 transition-all hover:bg-[#f8fafc] min-h-[48px] ${currentStep === 1 ? "invisible" : ""}`}
            >
              ← Previous
            </button>
            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-6 sm:px-8 bg-linear-to-r from-purple-400 to-indigo-500 border-none rounded-[14px] text-white font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] min-h-[48px]"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !allStepsValid}
                className="py-3 px-6 sm:px-8 bg-linear-to-r from-purple-400 to-indigo-500 border-none rounded-[14px] text-white font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  error,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[0.9rem] font-semibold text-[#374151] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className={`py-3.5 px-[18px] bg-[#f8fafc] border-2 rounded-xl text-[0.95rem] text-[#1e293b] outline-none transition-all placeholder:text-[#94a3b8] ${error ? "border-red-400" : "border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-purple-400"}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8fafc] rounded-xl px-4 py-3 border border-[#f1f5f9]">
      <p className="text-[0.8rem] font-medium text-[#64748b] mb-1">{label}</p>
      <p className="text-[0.95rem] font-semibold text-[#0f172a] break-words">{value}</p>
    </div>
  );
}

function formatReviewDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}
