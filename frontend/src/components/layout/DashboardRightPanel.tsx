"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DashboardData } from "@/types";
import NotificationBell from "@/components/NotificationBell";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardRightPanel({ onClose }: { onClose?: () => void }) {
  const [data, setData]   = useState<DashboardData | null>(null);
  const [ready, setReady] = useState(false);

  const todayIndex = (new Date().getDay() + 6) % 7; // 0=Mon

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const profile         = data?.profile;
  const upcomingSpeaking = data?.upcomingSpeaking;
  const attempts        = data?.attempts ?? [];
  
  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  // Build activity bars from real attempt data (last 7 days)
  const activityCounts = Array(7).fill(0);
  for (const a of attempts) {
    const d = new Date(a.started_at);
    const daysBefore = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (daysBefore >= 0 && daysBefore < 7) {
      // map to Mon-Sun index (0=Mon)
      const idx = (d.getDay() + 6) % 7;
      activityCounts[idx] += 1;
    }
  }
  const maxActivity = Math.max(...activityCounts, 1); // avoid div/0
  const totalTests  = attempts.length;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const planLabel = profile?.plan
    ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)
    : "";

  const planColor = (plan?: string) => {
    if (plan === "pro")       return { bg: "#efe7ff", color: "#6a45d0" };
    if (plan === "intensive") return { bg: "#d7e6ff", color: "#2a55a0" };
    if (plan === "premium")   return { bg: "#dff1e8", color: "#2a9350" };
    return { bg: "#f6f7fb", color: "#7b7b8d" };
  };

  const speakingDate = upcomingSpeaking
    ? new Date(upcomingSpeaking.scheduled_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : null;
  const speakingTime = upcomingSpeaking
    ? new Date(upcomingSpeaking.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <aside className="flex flex-col bg-white h-screen overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-5 flex flex-col gap-5 min-h-full">

        {/* Mobile/Tablet Close Button */}
        {onClose && (
          <div className="flex items-center justify-between xl:hidden mb-3 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Profile & Activity</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Notifications ──────────────────────────────────────── */}
        <div className="flex justify-end">
          <NotificationBell />
        </div>

        {/* ── My profile ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-[#222225]" style={{ letterSpacing: "-0.03em" }}>My profile</h3>
            <Link
              href="/dashboard/profile"
              onClick={handleLinkClick}
              className="w-9 h-9 rounded-[12px] border border-[#ececf3] bg-white grid place-items-center text-[#676979] hover:bg-[#efe7ff] hover:text-[#9a72ff] transition-colors cursor-pointer"
              title="Edit profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Link>
          </div>

          {/* Avatar */}
          <div className="text-center pt-1">
            {ready ? (
              <>
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #9a72ff 0%, #8f69f7 100%)",
                    boxShadow: "0 8px 16px rgba(159,121,255,0.28)",
                  }}
                >
                  {initials}
                </div>
                <p className="font-bold text-[#222225] text-sm" style={{ letterSpacing: "-0.02em" }}>
                  {profile?.full_name ?? "Student"}
                </p>
                {profile?.email && (
                  <p className="text-xs text-[#a4a4b5] mt-0.5 truncate px-2">{profile.email}</p>
                )}
                {planLabel && (
                  <div className="mt-2 flex justify-center">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: planColor(profile?.plan).bg, color: planColor(profile?.plan).color }}
                    >
                      {planLabel} Plan
                    </span>
                  </div>
                )}
                {profile?.target_band && (
                  <p className="text-xs text-[#7b7b8d] mt-1.5">
                    Target: <span className="font-bold text-[#222225]">Band {profile.target_band}</span>
                  </p>
                )}
                <Link
                  href="/dashboard/profile"
                  onClick={handleLinkClick}
                  className="mt-3 inline-block text-xs font-semibold px-3 py-1.5 rounded-[10px] transition-colors cursor-pointer"
                  style={{ background: "#efe7ff", color: "#6a45d0" }}
                >
                  Edit profile
                </Link>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full mx-auto mb-2 animate-pulse" style={{ background: "#ececf3" }} />
                <div className="h-4 bg-[#ececf3] rounded animate-pulse mx-auto w-28 mb-1.5" />
                <div className="h-3 bg-[#f1f1f7] rounded animate-pulse mx-auto w-36 mb-2" />
                <div className="h-5 bg-[#f1f1f7] rounded-full animate-pulse mx-auto w-20" />
              </>
            )}
          </div>
        </section>

        <div className="h-px bg-[#ececf3]" />

        {/* ── Study Activity ──────────────────────────────────────── */}
        <section>
          <div
            className="rounded-[18px] border border-[#f0f0f7] p-4"
            style={{ background: "#fafafe" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="block text-xs font-semibold text-[#7f8090] mb-1">Study Activity</span>
                <strong className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.06em" }}>
                  {ready ? totalTests : "—"}
                  <span className="text-sm font-semibold text-[#7b7b8d] ml-1">tests taken</span>
                </strong>
              </div>
              <span className="h-10 px-3 rounded-[14px] border border-[#dfdfeb] bg-white inline-flex items-center text-xs font-semibold text-[#505363]">
                Weekly
              </span>
            </div>

            {/* Bar chart — real data from attempts */}
            <div className="flex items-end gap-1.5 h-20">
              {activityCounts.map((count, i) => {
                const isToday = i === todayIndex;
                const barH = Math.round((count / maxActivity) * 80);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className="w-full rounded-[8px_8px_5px_5px]"
                      style={{
                        height: `${Math.max(barH, 6)}px`,
                        background: isToday
                          ? "linear-gradient(180deg, #a175ff 0%, #8f69f7 100%)"
                          : count > 0 ? "#9a72ff" : "#ececf3",
                        opacity: count === 0 ? 0.4 : 1,
                      }}
                    />
                    <span className="text-[0.7rem] font-medium" style={{ color: isToday ? "#8f69f7" : "#5f6272" }}>
                      {DAYS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#efe7ff", borderTopColor: "#9a72ff" }} />
              </div>
            )}
          </div>
        </section>

        <div className="h-px bg-[#ececf3]" />

        {/* ── Speaking ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[#222225]" style={{ letterSpacing: "-0.03em" }}>Speaking</h3>
            <Link href="/dashboard/book-speaking" onClick={handleLinkClick} className="text-xs font-semibold cursor-pointer" style={{ color: "#9a72ff" }}>
              + Book
            </Link>
          </div>

          {!ready ? (
            <div className="rounded-[18px] border border-[#ececf3] p-4 animate-pulse" style={{ background: "#fafafe" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px]" style={{ background: "#ececf3" }} />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 rounded w-28" style={{ background: "#ececf3" }} />
                  <div className="h-3 rounded w-20" style={{ background: "#f1f1f7" }} />
                </div>
              </div>
            </div>
          ) : speakingDate ? (
            <div className="rounded-[18px] border border-[#ececf3] p-4" style={{ background: "#fafafe" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #9a72ff 0%, #8f69f7 100%)" }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#222225]">Speaking Session</p>
                  <p className="text-xs font-medium truncate" style={{ color: "#9a72ff" }}>
                    {speakingDate} · {speakingTime}
                  </p>
                </div>
              </div>
              <div
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[10px] w-fit"
                style={{ background: "#dff1e8", color: "#2a9350" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#34ba65]" />
                Confirmed
              </div>
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#ececf3] p-4 text-center">
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center mx-auto mb-2"
                style={{ background: "#efe7ff" }}
              >
                <svg className="w-5 h-5" style={{ color: "#9a72ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-sm text-[#7b7b8d] mb-2">No session booked</p>
              <Link
                href="/dashboard/book-speaking"
                onClick={handleLinkClick}
                className="text-xs font-semibold px-3 py-1.5 rounded-[10px] cursor-pointer inline-block transition-colors"
                style={{ background: "#efe7ff", color: "#6a45d0" }}
              >
                Book a session →
              </Link>
            </div>
          )}
        </section>

        <div className="h-px bg-[#ececf3]" />

        {/* ── Quick Actions ───────────────────────────────────────── */}
        <section>
          <h3 className="font-bold text-sm text-[#222225] mb-3" style={{ letterSpacing: "-0.03em" }}>Quick Actions</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: "Start new test",   href: "/start-test",             bg: "#efe7ff", color: "#6a45d0" },
              { label: "View results",     href: "/results",                 bg: "#dff1e8", color: "#2a9350" },
              { label: "Test history",     href: "/dashboard/history",       bg: "#f6f7fb", color: "#353741" },
              { label: "Book speaking",    href: "/dashboard/book-speaking", bg: "#fff2b3", color: "#7a6000" },
              { label: "My tests",         href: "/dashboard/my-tests",      bg: "#d7e6ff", color: "#2a55a0" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[14px] text-sm font-semibold transition-opacity hover:opacity-80 cursor-pointer"
                style={{ background: link.bg, color: link.color }}
              >
                {link.label}
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </aside>
  );
}
