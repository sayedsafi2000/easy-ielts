"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

const BAND_BUCKETS = ["9.0","8.5","8.0","7.5","7.0","6.5","6.0","5.5","5.0","4.5","4.0"];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bandBars, setBandBars] = useState<Array<{ band: string; count: number }>>([]);
  const [activity, setActivity] = useState<Array<{ msg: string; time: string; color: string }>>([]);

  useEffect(() => {
    // Load stats
    api.get<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));

    // Load real band distribution from results
    api.get<any[]>("/api/admin/results").then(rows => {
      const counts: Record<string, number> = {};
      for (const r of rows ?? []) {
        const b = r.band_score != null ? parseFloat(r.band_score) : null;
        if (b == null || b <= 0) continue;
        // Round to nearest 0.5
        const key = (Math.round(b * 2) / 2).toFixed(1);
        counts[key] = (counts[key] ?? 0) + 1;
      }
      const bars = BAND_BUCKETS.map(band => ({ band, count: counts[band] ?? 0 })).filter(b => b.count > 0);
      setBandBars(bars.length ? bars : []);
    }).catch(() => {});

    // Build activity feed from recent submissions + bookings
    Promise.all([
      api.get<any[]>("/api/admin/submissions").catch(() => []),
      api.get<any[]>("/api/admin/bookings").catch(() => []),
      api.get<any[]>("/api/admin/students").catch(() => []),
    ]).then(([subs, bookings, students]) => {
      const events: Array<{ ts: number; msg: string; color: string }> = [];

      for (const s of (subs ?? []).slice(0, 8)) {
        const name = s.profiles?.full_name ?? "A student";
        const band = s.band_score != null ? ` — Band ${s.band_score}` : "";
        if (s.status === "reviewed") {
          events.push({ ts: new Date(s.submitted_at).getTime(), msg: `Writing reviewed: ${name}${band}`, color: "#34ba65" });
        } else {
          events.push({ ts: new Date(s.submitted_at).getTime(), msg: `Writing submitted: ${name}`, color: "#c89a00" });
        }
      }
      for (const b of (bookings ?? []).slice(0, 5)) {
        const name = b.student_name ?? "A student";
        if (b.status === "confirmed") {
          events.push({ ts: new Date(b.created_at ?? b.scheduled_at).getTime(), msg: `Speaking booked: ${name}`, color: "#9a72ff" });
        } else if (b.status === "completed") {
          events.push({ ts: new Date(b.scheduled_at).getTime(), msg: `Speaking completed: ${name}`, color: "#2a9350" });
        }
      }
      for (const st of (students ?? []).slice(0, 4)) {
        events.push({ ts: new Date(st.created_at).getTime(), msg: `New student: ${st.full_name ?? st.email}`, color: "#9a72ff" });
      }

      // Sort newest first
      events.sort((a, b) => b.ts - a.ts);

      const now = Date.now();
      const fmt = (ts: number) => {
        const diff = now - ts;
        const mins = Math.floor(diff / 60_000);
        const hrs  = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (days > 0)  return `${days}d ago`;
        if (hrs  > 0)  return `${hrs}h ago`;
        if (mins > 0)  return `${mins}min ago`;
        return "just now";
      };

      setActivity(events.slice(0, 6).map(e => ({ msg: e.msg, time: fmt(e.ts), color: e.color })));
    });
  }, []);

  const kpis = [
    {
      label: "Total Students",
      value: loading ? "…" : String(stats?.totalStudents ?? 0),
      sub: "registered",
      bg: "#efe7ff", iconColor: "#6a45d0",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: "Tests This Month",
      value: loading ? "…" : String(stats?.testsThisMonth ?? 0),
      sub: "total attempts",
      bg: "#d7e6ff", iconColor: "#2a55a0",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      label: "Pending Reviews",
      value: loading ? "…" : String(stats?.pendingReviews ?? 0),
      sub: "need attention",
      bg: "#fff2b3", iconColor: "#7a6000",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Speaking Today",
      value: loading ? "…" : String(stats?.upcomingSpeaking?.length ?? 0),
      sub: "upcoming",
      bg: "#dff1e8", iconColor: "#2a9350",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
    },
    {
      label: "Avg Band Score",
      value: loading ? "…" : (stats?.avgBand ?? "—"),
      sub: "across all results",
      bg: "#ffecd6", iconColor: "#b86a1a",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },
    {
      label: "Revenue (MTD)",
      value: "$0",
      sub: "billing not set up",
      bg: "#fde0eb", iconColor: "#b8245a",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Dashboard</h1>
          <p className="text-sm text-[#7b7b8d] mt-0.5">{today}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/submissions"
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "#c89a00", boxShadow: "0 8px 18px rgba(200,154,0,0.25)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Review Queue ({loading ? "…" : stats?.pendingReviews ?? 0})
          </Link>
          <Link
            href="/admin/students"
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Manage Students
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[20px] flex items-center gap-4 p-6" style={{ background: k.bg, boxShadow: "0 14px 28px rgba(32,28,54,0.06)", minHeight: "112px" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.52)", color: k.iconColor }}>
              {k.icon}
            </div>
            <div>
              <p className="text-[2rem] font-bold text-[#222225] leading-none mb-1" style={{ letterSpacing: "-0.05em" }}>{k.value}</p>
              <p className="text-sm font-semibold text-[#4b4d58]">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[20px] p-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <h2 className="text-sm font-bold text-[#222225] mb-5">Band Score Distribution</h2>
          {bandBars.length === 0 ? (
            <p className="text-xs text-[#a4a4b5] text-center py-8">No results yet</p>
          ) : (() => {
            const maxCount = Math.max(...bandBars.map(b => b.count), 1);
            return (
              <div className="space-y-2.5">
                {bandBars.map((b) => (
                  <div key={b.band} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#7b7b8d] w-7 text-right flex-shrink-0">{b.band}</span>
                    <div className="flex-1 rounded-full h-2" style={{ background: "#f6f7fb" }}>
                      <div className="h-2 rounded-full" style={{ width: `${(b.count / maxCount) * 100}%`, background: "linear-gradient(90deg, #9f79ff, #8f69f7)" }} />
                    </div>
                    <span className="text-xs text-[#a4a4b5] w-6 flex-shrink-0">{b.count}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="bg-white rounded-[20px] p-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[#222225]">Upcoming Speaking</h2>
            <Link href="/admin/bookings" className="text-xs font-semibold cursor-pointer" style={{ color: "#9a72ff" }}>View all</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-[14px]" style={{ background: "#f6f7fb" }} />)}
              </div>
            ) : stats?.upcomingSpeaking?.length ? (
              stats.upcomingSpeaking.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: "#f6f7fb" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#efe7ff" }}>
                    <svg className="w-4 h-4" style={{ color: "#9a72ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#222225] truncate">Speaking session</p>
                    <p className="text-xs text-[#7b7b8d]">{formatTime(b.scheduled_at)}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#dff1e8", color: "#2a9350" }}>Confirmed</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#7b7b8d] text-center py-6">No upcoming sessions</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <h2 className="text-sm font-bold text-[#222225] mb-5">Recent Activity</h2>
          <div className="space-y-4">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color }} />
                <div>
                  <p className="text-xs text-[#353741] leading-relaxed">{a.msg}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#a4a4b5" }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
