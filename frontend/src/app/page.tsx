"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  FileText,
  Clock,
  Shield,
  Zap,
  BarChart3,
  Star,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Heart,
  Send,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Utility: Intersection-observer "reveal on scroll"                  */
/* ------------------------------------------------------------------ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function Counter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal();

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(id);
  }, [visible, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Orbs (hero background decoration)                         */
/* ------------------------------------------------------------------ */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large purple orb */}
      <div
        className="absolute rounded-full opacity-30 blur-3xl"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
          top: "-15%",
          right: "-10%",
          animation: "floatOrb1 8s ease-in-out infinite",
        }}
      />
      {/* Cyan orb */}
      <div
        className="absolute rounded-full opacity-25 blur-3xl"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, #67e8f9 0%, transparent 70%)",
          bottom: "-10%",
          left: "-8%",
          animation: "floatOrb2 10s ease-in-out infinite",
        }}
      />
      {/* Small pink orb */}
      <div
        className="absolute rounded-full opacity-20 blur-2xl"
        style={{
          width: 300,
          height: 300,
          background: "radial-gradient(circle, #f0abfc 0%, transparent 70%)",
          top: "40%",
          left: "60%",
          animation: "floatOrb3 12s ease-in-out infinite",
        }}
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Particle sparkles drifting across the hero                         */
/* ------------------------------------------------------------------ */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      r: number;
      dx: number;
      dy: number;
      alpha: number;
      da: number;
    }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // seed particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        da: (Math.random() - 0.5) * 0.008,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha += p.da;
        if (p.alpha <= 0.05 || p.alpha >= 0.6) p.da *= -1;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165,130,255,${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */
export default function Home() {
  /* reveal refs for each section */
  const hero = useReveal();
  const features = useReveal();
  const stats = useReveal();
  const steps = useReveal();
  const testimonials = useReveal();
  const cta = useReveal();

  /* Navbar scroll shadow */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col text-[#1e293b] bg-[#f8fafc] overflow-x-hidden">
        {/* ==================== NAV ==================== */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3 transition-all duration-300 ${
            scrolled
              ? "bg-white/90 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,.06)]"
              : "bg-white/70 backdrop-blur-xl"
          } border-b border-white/60`}
        >
          <Link
            href="/"
            className="flex items-center no-underline"
          >
            <img src="/logo.png" alt="RecruitPro Logo" className="h-[40px] sm:h-[50px] w-auto" />
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-[#475569] text-sm sm:text-[0.9rem] font-medium no-underline hover:text-[#0f172a] transition-colors py-2 px-3 rounded-lg hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              id="nav-signup"
              className="text-sm sm:text-[0.9rem] font-semibold text-white no-underline bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* ==================== HERO ==================== */}
        <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-12">
          <FloatingOrbs />
          <ParticleField />

          <div
            ref={hero.ref}
            className={`relative z-10 max-w-[900px] mx-auto text-center reveal-up ${hero.visible ? "visible" : ""}`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 sm:mb-8 rounded-full bg-white/80 backdrop-blur border border-indigo-100 shadow-sm">
              <Sparkles size={14} className="text-indigo-500" />
              <span className="text-xs sm:text-sm font-semibold text-indigo-700 tracking-wide">
                Your Career Starts Here
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-[2.5rem] min-[480px]:text-[3rem] sm:text-[3.75rem] lg:text-[4.5rem] font-extrabold leading-[1.1] mb-5 sm:mb-7 tracking-tight">
              <span className="text-[#0f172a]">Land Your </span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #d946ef 100%)",
                }}
              >
                Dream Role
              </span>
              <br />
              <span className="text-[#0f172a]">With </span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
                }}
              >
                Confidence
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-[#64748b] text-base sm:text-lg lg:text-xl max-w-[600px] mx-auto leading-relaxed mb-8 sm:mb-10">
              A seamless application experience powered by smart technology.
              Apply in minutes, track your progress in real-time, and take the
              next step toward an exciting career.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/signup"
                id="hero-apply"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-10 text-white rounded-2xl font-semibold text-base sm:text-lg no-underline transition-all duration-300 hover:-translate-y-1 min-h-[56px] overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                  boxShadow: "0 20px 40px rgba(99,102,241,.3)",
                  animation: "pulseGlow 3s ease-in-out infinite",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Apply Now
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
                {/* shimmer overlay */}
                <span
                  className="absolute inset-0 z-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s linear infinite",
                  }}
                />
              </Link>
              <Link
                href="/login"
                id="hero-login"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 bg-white/80 backdrop-blur border-2 border-[#e2e8f0] text-[#475569] rounded-2xl font-semibold text-base no-underline transition-all duration-300 hover:bg-white hover:border-indigo-200 hover:text-indigo-700 hover:-translate-y-0.5 hover:shadow-lg min-h-[56px]"
              >
                Sign in to Dashboard
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            {/* Social proof mini */}
            <div className="flex items-center justify-center gap-3 text-sm text-[#94a3b8]">
              <div className="flex -space-x-2">
                {["#6366f1", "#8b5cf6", "#06b6d4", "#d946ef"].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: c, zIndex: 4 - i }}
                  >
                    {["J", "P", "K", "M"][i]}
                  </div>
                ))}
              </div>
              <span>
                <strong className="text-[#475569]">50+</strong> applicants joined recently
              </span>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-12 bg-white">
          <div
            ref={features.ref}
            className={`max-w-[1120px] mx-auto reveal-up ${features.visible ? "visible" : ""}`}
          >
            <div className="text-center mb-14 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-wide uppercase">
                <Zap size={13} /> Why RecruitPro
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#0f172a] tracking-tight mb-4">
                Everything You Need to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Succeed
                </span>
              </h2>
              <p className="text-[#64748b] text-base sm:text-lg max-w-[520px] mx-auto">
                We&apos;ve built a modern hiring platform designed to make applying
                effortless and transparent.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                {
                  icon: <FileText size={24} />,
                  title: "Easy Applications",
                  desc: "Our intuitive multi-step form guides you through every field — no guesswork, no frustration.",
                  gradient: "from-indigo-500 to-blue-500",
                  bg: "bg-indigo-50",
                  delay: "stagger-1",
                },
                {
                  icon: <Clock size={24} />,
                  title: "Real-Time Tracking",
                  desc: "Know exactly where your application stands at every stage. No more wondering in silence.",
                  gradient: "from-purple-500 to-pink-500",
                  bg: "bg-purple-50",
                  delay: "stagger-2",
                },
                {
                  icon: <Shield size={24} />,
                  title: "Secure & Private",
                  desc: "Your data is encrypted and protected. We take your privacy seriously — always.",
                  gradient: "from-cyan-500 to-teal-500",
                  bg: "bg-cyan-50",
                  delay: "stagger-3",
                },
                {
                  icon: <BarChart3 size={24} />,
                  title: "Smart Dashboard",
                  desc: "A personalised dashboard to view all your submissions, statuses, and next steps at a glance.",
                  gradient: "from-orange-500 to-amber-500",
                  bg: "bg-orange-50",
                  delay: "stagger-4",
                },
                {
                  icon: <Users size={24} />,
                  title: "Dedicated Support",
                  desc: "Our recruitment team reviews every application individually and responds within 5–7 business days.",
                  gradient: "from-rose-500 to-pink-500",
                  bg: "bg-rose-50",
                  delay: "stagger-5",
                },
                {
                  icon: <Zap size={24} />,
                  title: "Lightning Fast",
                  desc: "Optimised for speed — complete your application in under 5 minutes from start to finish.",
                  gradient: "from-violet-500 to-indigo-500",
                  bg: "bg-violet-50",
                  delay: "stagger-6",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className={`group relative p-6 sm:p-7 rounded-2xl bg-white border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,.04)] hover:shadow-[0_20px_50px_rgba(99,102,241,.1)] hover:-translate-y-1 transition-all duration-500 cursor-default reveal-up ${features.visible ? "visible" : ""} ${f.delay}`}
                >
                  <div
                    className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 text-transparent bg-clip-text`}
                  >
                    <span className={`bg-gradient-to-br ${f.gradient} text-transparent bg-clip-text`}>
                      <span className="text-current" style={{ color: "inherit" }}>
                        {/* Icon rendered with gradient color workaround */}
                      </span>
                    </span>
                    <span className={`text-indigo-600`}>{f.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0f172a] mb-2 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed">
                    {f.desc}
                  </p>
                  {/* bottom accent line on hover */}
                  <div
                    className={`absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r ${f.gradient} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== STATS ==================== */}
        <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-12 overflow-hidden">
          {/* Subtle gradient bg */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #ecfeff 100%)",
            }}
          />

          <div
            ref={stats.ref}
            className={`max-w-[1000px] mx-auto reveal-up ${stats.visible ? "visible" : ""}`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                { n: 50, suffix: "+", label: "Applications Processed", icon: <FileText size={22} /> },
                { n: 95, suffix: "%", label: "Satisfaction Rate", icon: <Heart size={22} /> },
                { n: 48, suffix: "h", label: "Avg. Response Time", icon: <Clock size={22} /> },
                { n: 100, suffix: "%", label: "Secure Apply", icon: <Shield size={22} /> },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`text-center p-6 sm:p-8 rounded-2xl bg-white/70 backdrop-blur border border-white/80 shadow-[0_4px_20px_rgba(99,102,241,.06)] reveal-up ${stats.visible ? "visible" : ""} stagger-${i + 1}`}
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    {s.icon}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-1 tracking-tight">
                    <Counter target={s.n} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-[#64748b] font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-12 bg-white">
          <div
            ref={steps.ref}
            className={`max-w-[960px] mx-auto reveal-up ${steps.visible ? "visible" : ""}`}
          >
            <div className="text-center mb-14 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold tracking-wide uppercase">
                <Send size={13} /> How It Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
                Three Simple Steps to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
                  Get Started
                </span>
              </h2>
              <p className="text-[#64748b] text-base sm:text-lg max-w-[480px] mx-auto">
                We&apos;ve made the application process as smooth as possible.
              </p>
            </div>

            <div className="relative grid md:grid-cols-3 gap-8 sm:gap-10">
              {/* Connection line */}
              <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-[2px] bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 opacity-50" />

              {[
                {
                  step: "01",
                  title: "Create Account",
                  desc: "Sign up with your email in seconds. No lengthy forms — just the essentials to get started.",
                  icon: <Users size={26} />,
                  color: "from-indigo-500 to-blue-500",
                },
                {
                  step: "02",
                  title: "Submit Application",
                  desc: "Fill in your details through our guided multi-step form. Upload documents and hit submit.",
                  icon: <FileText size={26} />,
                  color: "from-purple-500 to-pink-500",
                },
                {
                  step: "03",
                  title: "Track & Get Hired",
                  desc: "Monitor your application status in real-time from your dashboard. We'll be in touch soon!",
                  icon: <CheckCircle2 size={26} />,
                  color: "from-emerald-500 to-teal-500",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`relative text-center reveal-up ${steps.visible ? "visible" : ""} stagger-${i + 1}`}
                >
                  {/* Step circle */}
                  <div
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-xl`}
                    style={{ animation: `float ${3 + i * 0.5}s ease-in-out infinite` }}
                  >
                    {s.icon}
                    {/* step number badge */}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[0.65rem] font-bold text-[#0f172a] flex items-center justify-center shadow-md border border-[#e2e8f0]">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed max-w-[280px] mx-auto">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== TESTIMONIALS ==================== */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-12">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
            }}
          />
          <div
            ref={testimonials.ref}
            className={`max-w-[1120px] mx-auto reveal-up ${testimonials.visible ? "visible" : ""}`}
          >
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold tracking-wide uppercase">
                <Star size={13} /> Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
                What Our{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">
                  Applicants Say
                </span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: "Jai Mishra",
                  role: "Software Engineer",
                  text: "The multi-step application form was incredibly easy to navigate. I never felt overwhelmed, and being able to save my progress halfway was a total lifesaver!",
                  rating: 5,
                  initials: "JM",
                  color: "#6366f1",
                },
                {
                  name: "Pranav Madhu",
                  role: "Backend Developer",
                  text: "The instant email notifications are a total game-changer. I knew the moment my status changed without having to repeatedly login and check the portal manually.",
                  rating: 5,
                  initials: "PM",
                  color: "#8b5cf6",
                },
                {
                  name: "Krishna Yadav",
                  role: "DevOps & Deployment",
                  text: "This is easily the best hiring platform I've ever used. The dashboard is super intuitive, and tracking my application in real-time gave me such great peace of mind.",
                  rating: 5,
                  initials: "KY",
                  color: "#06b6d4",
                },
                {
                  name: "Manogna Kolla",
                  role: "Security & Authentication",
                  text: "The real-time tracking feature is absolutely amazing. I always knew exactly where my application stood, which helped reduce so much stress during the long wait.",
                  rating: 5,
                  initials: "MK",
                  color: "#d946ef",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className={`relative p-6 sm:p-7 rounded-2xl bg-white border border-[#f1f5f9] shadow-[0_4px_20px_rgba(0,0,0,.04)] hover:shadow-[0_12px_40px_rgba(99,102,241,.08)] transition-all duration-500 reveal-up ${testimonials.visible ? "visible" : ""} stagger-${i + 1}`}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-[#334155] text-sm sm:text-[0.9rem] leading-relaxed mb-5 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0f172a]">
                        {t.name}
                      </div>
                      <div className="text-xs text-[#94a3b8]">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA ==================== */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-12 overflow-hidden">
          <div
            ref={cta.ref}
            className={`relative max-w-[800px] mx-auto text-center p-10 sm:p-14 rounded-3xl overflow-hidden reveal-up ${cta.visible ? "visible" : ""}`}
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
            }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #67e8f9 0%, transparent 70%)" }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white tracking-tight mb-4 leading-tight">
                Ready to Take the
                <br />
                Next Step?
              </h2>
              <p className="text-indigo-100 text-base sm:text-lg max-w-[480px] mx-auto mb-8 leading-relaxed">
                Join hundreds of successful applicants. Your future starts with
                a single click.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  id="cta-apply"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-10 bg-white text-indigo-700 rounded-2xl font-bold text-base sm:text-lg no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,.25)] min-h-[56px]"
                >
                  Start Your Application
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 bg-white/10 backdrop-blur border border-white/20 text-white rounded-2xl font-semibold text-base no-underline transition-all duration-300 hover:bg-white/20 min-h-[56px]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="border-t border-[#e2e8f0] bg-white py-10 sm:py-12 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1120px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
              {/* Brand */}
              <div className="max-w-[280px]">
                <Link
                  href="/"
                  className="flex items-center no-underline mb-3"
                >
                  <img src="/logo.png" alt="RecruitPro Logo" className="h-[40px] sm:h-[50px] w-auto" />
                </Link>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  A modern applicant tracking system designed to make hiring
                  seamless for everyone.
                </p>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-12 sm:gap-16 text-sm">
                <div>
                  <h4 className="font-semibold text-[#0f172a] mb-3">
                    Applicants
                  </h4>
                  <ul className="space-y-2 list-none p-0 m-0">
                    <li>
                      <Link
                        href="/signup"
                        className="text-[#64748b] no-underline hover:text-indigo-600 transition-colors"
                      >
                        Apply Now
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/login"
                        className="text-[#64748b] no-underline hover:text-indigo-600 transition-colors"
                      >
                        Applicant Login
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] mb-3">Staff</h4>
                  <ul className="space-y-2 list-none p-0 m-0">
                    <li>
                      <Link
                        href="/admin-login"
                        className="text-[#64748b] no-underline hover:text-indigo-600 transition-colors"
                      >
                        Staff Login
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] mb-3">Legal</h4>
                  <ul className="space-y-2 list-none p-0 m-0">
                    <li>
                      <Link
                        href="/terms"
                        className="text-[#64748b] no-underline hover:text-indigo-600 transition-colors"
                      >
                        Terms & Privacy
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-6 border-t border-[#f1f5f9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94a3b8]">
              <span>© {new Date().getFullYear()} RecruitPro. All rights reserved.</span>
              <span>
                Built with{" "}
                <Heart size={12} className="inline text-rose-400 fill-rose-400 -mt-0.5" />{" "}
                by Team D
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
