"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface AttemptRow {
  id: string;
  track: string;
  format: string;
  module: string | null;
  status: string;
  started_at: string;
  test_title: string;
  results: Array<{ module: string; band_score: number | null }>;
}

interface StudentData {
  profile: {
    id: string;
    full_name: string;
    email: string;
    plan: string;
    target_band: number | null;
    country: string | null;
    track: string | null;
    email_verified: boolean;
    created_at: string;
  };
  attempts: AttemptRow[];
  speaking_count: number;
  next_session: string | null;
}

function bandFor(a: AttemptRow, mod: string) {
  const r = a.results?.find(x => x.module === mod);
  return r?.band_score ?? null;
}

function overallBand(a: AttemptRow) {
  const scores = (a.results ?? []).map(r => r.band_score).filter(Boolean) as number[];
  if (!scores.length) return null;
  return Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 2) / 2;
}

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [data, setData]     = useState<StudentData | null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!id) return;
    api.get<StudentData>(`/api/admin/students/${id}`)
      .then(setData)
      .catch(e => setError(e?.message ?? "Failed to load student"))
      .finally(() => setLoad(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Students
        </Link>
        <div className="rounded-[16px] px-5 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {error || "Student not found."}
        </div>
      </div>
    );
  }

  const { profile, attempts, speaking_count, next_session } = data;
  const bestBand = attempts.length
    ? Math.max(...attempts.map(overallBand).filter(Boolean) as number[])
    : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Students
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)" }}
            >
              {profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  profile.email_verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {profile.email_verified ? "Active" : "Suspended"}
                </span>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                  {profile.plan}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                {profile.track ? profile.track.charAt(0).toUpperCase() + profile.track.slice(1) : "Academic"} Track ·
                Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Message
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tests Taken",       value: String(attempts.length) },
          { label: "Best Overall Band", value: bestBand ? String(bestBand) : "—" },
          { label: "Speaking Sessions", value: String(speaking_count) },
          { label: "Next Session",      value: next_session ? new Date(next_session).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "None" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test history */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Test History</h2>
          </div>
          <div className="overflow-x-auto">
            {attempts.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No tests taken yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-6 py-3">Test</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">L</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">R</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">W</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">S</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map(a => {
                    const ov = overallBand(a);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-xs font-semibold text-slate-800">{a.test_title}</p>
                          <p className="text-xs text-slate-400 capitalize">{a.format} · {a.track} · {a.status}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {a.started_at ? new Date(a.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{bandFor(a, "listening") ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{bandFor(a, "reading")   ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{bandFor(a, "writing")   ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{bandFor(a, "speaking")  ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-900">{ov ?? "—"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Account Info</h2>
            <div className="space-y-2 text-xs">
              {[
                { label: "Plan",          value: profile.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : "—" },
                { label: "Track",         value: profile.track ? profile.track.charAt(0).toUpperCase() + profile.track.slice(1) : "Academic" },
                { label: "Target Band",   value: String(profile.target_band ?? "—") },
                { label: "Country",       value: profile.country ?? "—" },
                { label: "Email Verified",value: profile.email_verified ? "Yes" : "No" },
                { label: "Joined",        value: profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-medium text-slate-800">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
