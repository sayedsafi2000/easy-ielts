"use client";
import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      { q: "How do I create an account?", a: "Click 'Sign Up' and fill in your details. You'll receive a verification email to activate your account." },
      { q: "What's included in the free trial?", a: "7-day access to all mock tests, auto-marked modules, and one Writing feedback session." },
      { q: "Do I need to download anything?", a: "No! IELTS Journal works entirely in your browser on any device." },
    ],
  },
  {
    category: "Tests & Scoring",
    questions: [
      { q: "How long does Writing feedback take?", a: "Expert feedback is delivered within 24 hours of submission." },
      { q: "Can I retake a test?", a: "Yes! You can retake any test as many times as you like (plan limits apply)." },
      { q: "Are the tests like the real IELTS?", a: "Yes. Our tests follow the official IELTS format exactly—same structure, timing, and difficulty." },
    ],
  },
  {
    category: "Speaking Sessions",
    questions: [
      { q: "How do Speaking sessions work?", a: "Book a 15-minute video call with a certified examiner. You'll receive band scores + feedback within 24h." },
      { q: "Can I reschedule my Speaking session?", a: "Yes, up to 24 hours before your scheduled time." },
      { q: "What if my examiner doesn't show up?", a: "Contact support immediately and we'll reschedule at no extra charge." },
    ],
  },
  {
    category: "Billing & Plans",
    questions: [
      { q: "Can I cancel anytime?", a: "Yes. Cancel from your account settings. You'll retain access until the end of your billing period." },
      { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers." },
      { q: "Do you offer refunds?", a: "Yes, within 14 days if you're not satisfied (terms apply)." },
    ],
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-slate-900">IELTS <span className="text-blue-700">Journal</span></span>
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">← Back to Home</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Help Centre</h1>
          <p className="text-lg text-slate-600 mb-8">Find answers to common questions about IELTS Journal</p>
          
          {/* Search (placeholder) */}
          <div className="max-w-2xl mx-auto">
            <input 
              type="search"
              placeholder="Search for help..."
              className="w-full px-6 py-4 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-5 space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{section.category}</h2>
              <div className="space-y-3">
                {section.questions.map((item, qIdx) => {
                  const key = `${idx}-${qIdx}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : key)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-semibold text-slate-900">{item.q}</span>
                        <svg 
                          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-slate-600 border-t border-slate-100">
                          <p className="pt-4">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Still need help */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Still Need Help?</h3>
            <p className="text-slate-600 mb-4">Can't find what you're looking for? Get in touch with our support team.</p>
            <Link 
              href="/contact" 
              className="inline-block bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
