"use client";
import Link from "next/link";
import { useState } from "react";

export default function VerifyEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          We sent a 6-digit verification code to{" "}
          <span className="font-medium text-slate-900">sarah@example.com</span>.
          Enter it below to verify your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-10 shadow-sm">
          {/* OTP inputs */}
          <div className="flex gap-3 justify-center mb-6">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                className="w-11 h-12 text-center text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              />
            ))}
          </div>

          <Link
            href="/dashboard"
            className="block w-full bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-800 transition-colors text-center cursor-pointer"
          >
            Verify account
          </Link>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-600">
              Didn&apos;t receive the email?{" "}
              <button className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer">Resend code</button>
            </p>
            <p className="text-xs text-slate-500 mt-2">Check your spam folder if you can&apos;t find it.</p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Wrong email?{" "}
          <Link href="/register" className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
