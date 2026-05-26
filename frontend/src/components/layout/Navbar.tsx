"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-700 text-slate-900">IELTS<span className="text-blue-700">Pro</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-slate-600 hover:text-blue-700 transition-colors cursor-pointer">Features</Link>
            <Link href="/#how-it-works" className="text-sm text-slate-600 hover:text-blue-700 transition-colors cursor-pointer">How it works</Link>
            <Link href="/#pricing" className="text-sm text-slate-600 hover:text-blue-700 transition-colors cursor-pointer">Pricing</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors cursor-pointer">Log in</Link>
            <Link href="/register" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer">Get started</Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-3">
            <Link href="/#features" className="block text-sm text-slate-600 hover:text-blue-700 py-1 cursor-pointer">Features</Link>
            <Link href="/#how-it-works" className="block text-sm text-slate-600 hover:text-blue-700 py-1 cursor-pointer">How it works</Link>
            <Link href="/#pricing" className="block text-sm text-slate-600 hover:text-blue-700 py-1 cursor-pointer">Pricing</Link>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" className="text-sm font-medium text-slate-700 py-2 cursor-pointer">Log in</Link>
              <Link href="/register" className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg text-center cursor-pointer">Get started</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
