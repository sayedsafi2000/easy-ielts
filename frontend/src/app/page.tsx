"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/* ─── Navbar ─────────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Send admins/examiners to /admin, students to /dashboard.
  const dashboardHref = user?.role === "admin" || user?.role === "examiner" ? "/admin" : "/dashboard";

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  // Smooth scroll without hash in URL
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-900">IELTS <span className="text-blue-700">Journal</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {["Home", "Modules", "Teachers", "Pricing", "FAQ"].map((n) => (
            <button key={n} onClick={() => scrollToSection(n.toLowerCase())} className="text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">{n}</button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-32 h-9" />
          ) : user ? (
            <>
              <Link href={dashboardHref} className="text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer">Dashboard</Link>
              <button onClick={handleLogout} className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer">Sign In</Link>
              <Link href="/register" className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">Get Started</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-600 cursor-pointer" aria-label="Menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden px-5 pb-4 space-y-3 border-t border-slate-100">
          {["Home", "Modules", "Teachers", "Pricing", "FAQ"].map((n) => (
            <button key={n} onClick={() => { scrollToSection(n.toLowerCase()); setOpen(false); }} className="block text-sm text-slate-600 py-1 cursor-pointer text-left w-full">{n}</button>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            {loading ? null : user ? (
              <>
                <Link href={dashboardHref} className="text-sm font-medium text-slate-700 cursor-pointer">Dashboard</Link>
                <button onClick={handleLogout} className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg text-center cursor-pointer">Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-700 cursor-pointer">Sign In</Link>
                <Link href="/register" className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg text-center cursor-pointer">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#d4f53c] text-slate-900 text-xs font-semibold px-3 py-1 rounded-full">
      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
      {children}
    </span>
  );
}

/* ─── Data ────────────────────────────────────────────────────────────── */
const steps = [
  {
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=80&h=80&fit=crop&q=80",
    title: "Create Your Account",
    desc: "Sign up in minutes and choose your IELTS track — Academic or General Training.",
  },
  {
    img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=80&h=80&fit=crop&q=80",
    title: "Choose Your Module",
    desc: "Practice a single module or take a full mock test from start to finish.",
  },
  {
    img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=80&h=80&fit=crop&q=80",
    title: "Learn with Experts",
    desc: "Access practice material and get your Writing and Speaking marked by certified examiners.",
  },
  {
    img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=80&h=80&fit=crop&q=80",
    title: "Track Your Progress",
    desc: "Get detailed band scores, criteria feedback, and improvement tips after every test.",
  },
];

const modules = [
  {
    tag: "Auto-marked",
    title: "Listening",
    desc: "40 questions across 4 sections. MCQ, fill-in-the-blank, and matching. Instant results.",
    color: "bg-blue-50 border-blue-200",
    tagColor: "bg-blue-100 text-blue-700",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=200&fit=crop&q=80",
  },
  {
    tag: "Auto-marked",
    title: "Reading",
    desc: "3 passages with True/False/Not Given, MCQ, and short answer. Detailed score breakdown.",
    color: "bg-violet-50 border-violet-200",
    tagColor: "bg-violet-100 text-violet-700",
    img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop&q=80",
  },
  {
    tag: "Expert reviewed",
    title: "Writing",
    desc: "Task 1 + Task 2. Manually marked on 4 IELTS criteria with written examiner feedback.",
    color: "bg-amber-50 border-amber-200",
    tagColor: "bg-amber-100 text-amber-700",
    img: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=400&h=200&fit=crop&q=80",
  },
  {
    tag: "Live session",
    title: "Speaking",
    desc: "Live video call with a certified examiner. Book your slot, take the test, get scored.",
    color: "bg-green-50 border-green-200",
    tagColor: "bg-green-100 text-green-700",
    img: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=200&fit=crop&q=80",
  },
];

const features = [
  {
    title: "Personalised Study Plan",
    desc: "Get a customised roadmap based on your target band score and weak areas.",
    img: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=220&fit=crop&q=80",
    bg: "bg-blue-50",
  },
  {
    title: "Full Mock Tests",
    desc: "Academic and General Training. Same format and timing as the real IELTS exam.",
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=220&fit=crop&q=80",
    bg: "bg-lime-50",
  },
  {
    title: "Downloadable Score Reports",
    desc: "PDF reports for every test — share with your university or immigration officer.",
    img: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=220&fit=crop&q=80",
    bg: "bg-orange-50",
  },
  {
    title: "Official Band Certificates",
    desc: "Receive a digital certificate for each completed and reviewed mock test.",
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=220&fit=crop&q=80",
    bg: "bg-violet-50",
  },
];

const testimonials = [
  {
    name: "Aisha Rahman",
    score: "7.5",
    country: "Bangladesh",
    text: "IELTS Journal helped me jump from 6.0 to 7.5 in just 6 weeks. The writing feedback was incredibly detailed.",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&q=80",
    stars: 5,
  },
  {
    name: "Carlos Mendez",
    score: "8.0",
    country: "Mexico",
    text: "The speaking sessions with real examiners made me so much more confident. I got Band 8 on my first attempt.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80",
    stars: 5,
  },
  {
    name: "Priya Sharma",
    score: "7.0",
    country: "India",
    text: "Best mock test platform I found. The reading section perfectly mimics the real exam. Highly recommend.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80",
    stars: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: "$19",
    desc: "For students just beginning their IELTS prep.",
    features: ["2 Full Mock Tests/month", "Auto-marked Listening & Reading", "Score reports", "Progress tracker"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$39",
    desc: "Most popular. Ideal for serious IELTS candidates.",
    features: ["Unlimited Mock Tests", "Expert Writing feedback", "2 Speaking sessions/month", "PDF certificates", "Priority support"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Intensive",
    price: "$69",
    desc: "For students with an upcoming exam and a target band.",
    features: ["Unlimited everything", "Daily speaking sessions", "1-on-1 study plan", "WhatsApp support", "Results within 24h"],
    cta: "Get started",
    highlight: false,
  },
];

const faqs = [
  { q: "How is the Speaking test conducted?", a: "Speaking is a live 15-minute video call with a certified IELTS examiner. You book your preferred time slot and join via the platform — no third-party app needed." },
  { q: "How long does Writing feedback take?", a: "Writing submissions are reviewed within 48 hours. You'll get a band score per criteria plus written examiner feedback on how to improve." },
  { q: "Can I take just one module instead of a full test?", a: "Yes. You can take any individual module — Listening, Reading, Writing, or Speaking — at any time. You don't have to take the full mock test every session." },
  { q: "Is this for Academic or General Training?", a: "Both. You select your track when you register and all content — passages, tasks, and speaking topics — is tailored to your chosen track." },
  { q: "Do I get certificates for completed tests?", a: "Yes. Every reviewed test generates a downloadable PDF certificate showing your band scores per module and your overall band score." },
];

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="home" className="bg-[#f0f4ff] overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-0 lg:pt-20 flex flex-col lg:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 lg:pr-10 pb-10 lg:pb-20">
            <Badge>Trusted by 10,000+ students</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Prepare for<br />
              <span className="text-amber-500">IELTS</span> Online<br />
              with Real Examiners
            </h1>
            <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-md">
              Full mock tests for all 4 modules. Auto-marked Listening &amp; Reading. Expert-reviewed Writing &amp; Speaking with band scores and personalised feedback.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=40&h=40&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&q=80",
                ].map((src, i) => (
                  <img key={i} src={src} alt="Student" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                ))}
              </div>
              <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">4,800+</span> students enrolled this month</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="bg-slate-900 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                Start Free Trial
              </Link>
              <Link href="#modules" className="text-sm font-semibold text-slate-700 px-6 py-3 rounded-xl border border-slate-300 hover:bg-white transition-colors cursor-pointer">
                Explore Modules →
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div className="flex-1 flex justify-end items-center self-center w-full">
            <div className="relative w-full max-w-lg">
              {/* Main photo */}
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] max-h-[480px] relative">
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=700&h=900&fit=crop&q=85"
                  alt="IELTS student"
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating band score card */}
              <div className="absolute top-6 -left-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#d4f53c] flex items-center justify-center text-lg font-extrabold text-slate-900">7.5</div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Band Score</p>
                  <p className="text-xs text-slate-500">Overall IELTS</p>
                </div>
              </div>

              {/* Floating progress card */}
              <div className="absolute bottom-8 -left-8 bg-white rounded-2xl shadow-xl px-5 py-4">
                <p className="text-xs font-bold text-slate-900 mb-3">Module progress</p>
                {[
                  { l: "Listening", v: 85 },
                  { l: "Reading", v: 72 },
                  { l: "Writing", v: 68 },
                ].map((m) => (
                  <div key={m.l} className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-500 w-16 flex-shrink-0">{m.l}</span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.v}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{m.v}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="home" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <Badge>How it works</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-slate-900">A Simple and Smart Way<br />to Prepare for IELTS</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-default group">
                <span className="absolute top-5 right-5 text-2xl font-black text-slate-100 group-hover:text-slate-200 select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-14 h-14 rounded-2xl overflow-hidden mb-4 shadow-sm">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ──────────────────────────────────────────────────── */}
      <section id="modules" className="py-20 bg-[#f7f8fc]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <Badge>Modules</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-slate-900">IELTS Modules for Every Level</h2>
            <p className="mt-3 text-slate-500 text-sm max-w-md mx-auto">From beginner to advanced. Practice one module or take the full test.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m) => (
              <div key={m.title} className={`rounded-2xl border overflow-hidden ${m.color} hover:shadow-md transition-all cursor-default group`}>
                {/* Module image */}
                <div className="h-36 overflow-hidden">
                  <img src={m.img} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.tagColor}`}>{m.tag}</span>
                  <h3 className="mt-3 text-base font-bold text-slate-900 mb-2">{m.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{m.desc}</p>
                  <Link href="/start-test" className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:gap-2 transition-all cursor-pointer">
                    Start now <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Speaking live (dark green) ────────────────────────────────── */}
      <section className="py-6 px-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0d2d1e] rounded-3xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-stretch gap-0">
              {/* Text */}
              <div className="flex-1 p-10 lg:p-14 flex flex-col justify-center">
                <Badge>Speaking Module</Badge>
                <h2 className="mt-5 text-3xl lg:text-4xl font-extrabold text-white leading-snug">
                  Take Your Speaking Test<br />Live with <span className="text-[#d4f53c]">Certified Examiners</span>
                </h2>
                <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-md">
                  No recordings, no AI scoring. A real 15-minute video call with a qualified IELTS examiner who marks you on all 4 official criteria.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Book your preferred date and time slot",
                    "Join directly from your browser — no app needed",
                    "Receive band scores + written feedback within 24h",
                    "Rebook any time with a different examiner",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-[#d4f53c] flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-8 inline-flex bg-[#d4f53c] text-slate-900 text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#c5e82d] transition-colors cursor-pointer w-fit">
                  Book a session →
                </Link>
              </div>

              {/* Image */}
              <div className="flex-1 min-h-64 lg:min-h-0 relative">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&h=600&fit=crop&q=85"
                  alt="IELTS examiner teaching"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d2d1e]/60 to-transparent lg:from-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
            <div className="lg:w-72 flex-shrink-0">
              <Badge>Features</Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                Everything You Need<br />to Master IELTS
              </h2>
              <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                All the tools, materials, and expert support in one place — designed around the official IELTS format.
              </p>
              <Link href="/register" className="mt-6 inline-flex bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">
                Get started free
              </Link>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className={`${f.bg} rounded-2xl overflow-hidden cursor-default hover:shadow-md transition-all group`}>
                  <div className="h-36 overflow-hidden">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Practice anywhere (lime) ──────────────────────────────────── */}
      <section className="py-6 px-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#d4f53c] rounded-3xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-stretch gap-0">
              {/* Image left */}
              <div className="lg:w-1/2 h-64 lg:h-auto flex-shrink-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&h=600&fit=crop&q=85"
                  alt="Student studying on phone"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text */}
              <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
                <Badge>Accessible</Badge>
                <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-slate-900 leading-snug">
                  Practice Anytime,<br />Anywhere
                </h2>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed max-w-md">
                  IELTS Journal works on any device — laptop, tablet, or phone. No download needed. Log in and practise on your lunch break, on the train, or anywhere that suits you.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div>
                      <p className="text-xs opacity-70">Download on the</p>
                      <p className="text-sm font-semibold">App Store</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.18 23.76c.3.17.64.24.99.19l13.12-7.57-2.84-2.84-11.27 10.22zM.44 1.15C.17 1.47 0 1.96 0 2.61v18.78c0 .65.17 1.14.44 1.46l.08.07 10.52-10.52v-.25L.52 1.08l-.08.07zM20.38 10.47l-2.99-1.73-3.17 3.17 3.17 3.17 3.01-1.74c.86-.5.86-1.3-.02-1.87zM4.17.24L17.29 7.8 14.45 10.64 3.18.42c.32-.22.69-.28 1-.18z"/>
                    </svg>
                    <div>
                      <p className="text-xs opacity-70">Get it on</p>
                      <p className="text-sm font-semibold">Google Play</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="py-20 bg-[#f7f8fc]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <Badge>Reviews</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-slate-900">Reviews from Our Students</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-5">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.country}</p>
                  </div>
                  <div className="ml-auto bg-[#d4f53c] text-slate-900 text-sm font-extrabold px-3 py-1 rounded-xl">
                    {t.score}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-10">
            <Badge>Pricing</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-slate-900">Choose the Plan That Works for You</h2>
            <p className="mt-3 text-sm text-slate-500">All plans include a 7-day free trial. No credit card required.</p>
            <div className="mt-6 inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(["monthly", "yearly"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setBilling(c)}
                  className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer capitalize ${billing === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {c} {c === "yearly" && <span className="text-green-600 text-xs font-bold">-20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-2xl p-7 border-2 transition-all ${p.highlight ? "bg-slate-900 border-slate-900 shadow-xl scale-105" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${p.highlight ? "text-[#d4f53c]" : "text-slate-500"}`}>{p.name}</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold ${p.highlight ? "text-white" : "text-slate-900"}`}>
                    {billing === "yearly" ? `$${Math.round(parseInt(p.price.slice(1)) * 0.8)}` : p.price}
                  </span>
                  <span className={`text-sm mb-1 ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>/month</span>
                </div>
                <p className={`mt-1 text-xs ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>{p.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-slate-200" : "text-slate-700"}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${p.highlight ? "bg-[#d4f53c]" : "bg-slate-100"}`}>
                        <svg className="w-2.5 h-2.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full text-center text-sm font-bold py-3 rounded-xl cursor-pointer transition-colors ${p.highlight ? "bg-[#d4f53c] text-slate-900 hover:bg-[#c5e82d]" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-[#f7f8fc]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-14">
            <div className="lg:w-64 flex-shrink-0">
              <Badge>FAQ</Badge>
              <h2 className="mt-4 text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">Frequently Asked Questions</h2>
              <p className="mt-3 text-sm text-slate-500">Can&apos;t find your answer? Reach out.</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=40&h=40&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&q=80",
                  ].map((src, i) => (
                    <img key={i} src={src} alt="Support" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <a href="mailto:support@ieltspro.com" className="text-sm font-medium text-blue-700 hover:underline cursor-pointer">Chat with us</a>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {faqs.map((f, i) => (
                <div key={f.q} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
                  >
                    <span className="text-sm font-semibold text-slate-900 pr-4">{f.q}</span>
                    <span className={`w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? "bg-slate-900 border-slate-900" : "group-hover:bg-slate-50"}`}>
                      <svg className={`w-3.5 h-3.5 transition-transform ${openFaq === i ? "text-white rotate-45" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5">
                      <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA (dark) ───────────────────────────────────────────────── */}
      <section className="py-6 px-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-3xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-stretch">
              <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
                <Badge>Get started today</Badge>
                <h2 className="mt-5 text-3xl lg:text-4xl font-extrabold text-white leading-snug">
                  Start Your IELTS<br />Journey <span className="text-[#d4f53c]">Today</span>
                </h2>
                <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                  Join 10,000+ students who improved their band score with IELTS Journal. 7-day free trial, no credit card needed.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/register" className="bg-[#d4f53c] text-slate-900 text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#c5e82d] transition-colors cursor-pointer">
                    Start Free Trial
                  </Link>
                  <Link href="/login" className="text-white text-sm font-semibold px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors cursor-pointer">
                    Sign In
                  </Link>
                </div>
              </div>
              {/* CTA image */}
              <div className="lg:w-1/2 h-64 lg:h-auto relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1627556704302-624286467c65?w=800&h=600&fit=crop&q=85"
                  alt="Student graduating"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent lg:from-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-xl mx-auto px-5 text-center">
          <Badge>Stay Updated</Badge>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Get IELTS tips in your inbox</h2>
          <p className="mt-2 text-sm text-slate-500">Study strategies, band score guides, and platform updates. No spam.</p>
          <form className="mt-6 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <button type="submit" className="bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="font-bold text-slate-900">IELTS <span className="text-blue-700">Journal</span></span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">The most realistic IELTS mock test platform — trusted by students worldwide.</p>
            </div>
            
            {/* Platform */}
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Platform</p>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link></li>
                <li><Link href="/start-test" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Listening</Link></li>
                <li><Link href="/start-test" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Reading</Link></li>
                <li><Link href="/start-test" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Writing</Link></li>
                <li><Link href="/start-test" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Speaking</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Company</p>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Press</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Support</p>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Help Centre</Link></li>
                <li><Link href="/contact" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">© 2026 IELTS Journal. All rights reserved.</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
