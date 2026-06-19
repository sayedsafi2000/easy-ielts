"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotificationBell from "@/components/NotificationBell";
import { api } from "@/lib/api";

type BadgeKey = "pendingSubmissions" | "actionableBookings";

interface NavItem {
  label: string;
  href: string;
  badgeKey: BadgeKey | null;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    badgeKey: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="2" strokeWidth={2} />
        <rect x="14" y="3" width="7" height="7" rx="2" strokeWidth={2} />
        <rect x="3" y="14" width="7" height="7" rx="2" strokeWidth={2} />
        <rect x="14" y="14" width="7" height="7" rx="2" strokeWidth={2} />
      </svg>
    ),
  },
  {
    label: "Mock Tests",
    href: "/admin/tests",
    badgeKey: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Students",
    href: "/admin/students",
    badgeKey: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Submissions",
    href: "/admin/submissions",
    badgeKey: "pendingSubmissions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    badgeKey: "actionableBookings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Results",
    href: "/admin/results",
    badgeKey: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 15l3-4 4 3 5-8" />
      </svg>
    ),
  },
  {
    label: "Examiners",
    href: "/admin/examiners",
    badgeKey: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/admin/settings",
    badgeKey: null,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface BadgeCounts {
  pendingSubmissions: number;
  actionableBookings: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts | null>(null);

  useEffect(() => {
    if (pathname !== "/admin/login") {
      api.get<BadgeCounts>("/api/admin/badge-counts")
        .then(setBadgeCounts)
        .catch(() => {});
    }
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  return (
    <ProtectedRoute roles={["admin", "examiner"]} redirectTo="/admin/login">
      <div className="flex min-h-screen overflow-hidden bg-white">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-auto transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col py-4 px-4 border-r border-[#ececf3] overflow-y-auto bg-[#fafafe]`}
          style={{ width: "260px" }}
        >
          <Link href="/" className="flex items-center gap-3 px-2 pb-6 pt-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #9a72ff 0%, #8f69f7 100%)" }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <span className="text-[1.05rem] font-bold tracking-tight text-[#222225] leading-none" style={{ letterSpacing: "-0.03em" }}>
                IELTS<span style={{ color: "#9a72ff" }}>Pro</span>
              </span>
              <p className="text-xs font-medium" style={{ color: "#a4a4b5" }}>Admin Portal</p>
            </div>
          </Link>

          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const badgeCount = item.badgeKey && badgeCounts ? badgeCounts[item.badgeKey] : 0;
              const showBadge = badgeCount && badgeCount > 0;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 h-11 px-3 rounded-[14px] font-semibold text-sm transition-all duration-150 cursor-pointer"
                  style={
                    active
                      ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "#fff", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }
                      : { color: "#353741" }
                  }
                >
                  <span className={`shrink-0 ${active ? "text-white" : "text-[#7b7b8d]"}`}>{item.icon}</span>
                  <span className="truncate flex-1 min-w-0">{item.label}</span>
                  {showBadge && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={active ? { background: "rgba(255,255,255,0.25)", color: "white" } : { background: "#ff4d59", color: "white" }}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#ececf3]">
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 h-10 px-3 rounded-[14px] text-sm font-semibold transition-colors cursor-pointer"
              style={{ color: "#353741" }}
            >
              <svg className="w-5 h-5 shrink-0" style={{ color: "#7b7b8d" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="whitespace-nowrap">Student View</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 h-10 px-3 rounded-[14px] text-sm font-semibold transition-colors cursor-pointer hover:bg-[#fff0f0] w-full text-left"
              style={{ color: "#ff4d59" }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="whitespace-nowrap">Sign out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8f8fb]">
          {/* Header with mobile menu button */}
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6 h-14 border-b border-[#ececf3]" style={{ background: "rgba(248,248,251,0.95)", backdropFilter: "blur(8px)" }}>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <NotificationBell />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
