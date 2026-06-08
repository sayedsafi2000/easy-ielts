"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    label: "My Tests",
    href: "/dashboard/my-tests",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Book Speaking",
    href: "/dashboard/book-speaking",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    label: "Test History",
    href: "/dashboard/history",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: "Results",
    href: "/results",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3-4 4 3 5-8" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 21a8 8 0 10-12 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className="flex flex-col py-4 px-4 border-r border-[#ececf3] h-screen overflow-y-auto bg-[#fafafe]"
    >
      <Link href="/" className="flex items-center gap-3 px-2 pb-6 pt-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #9a72ff 0%, #8f69f7 100%)" }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-[1.05rem] font-bold tracking-tight text-[#222225]" style={{ letterSpacing: "-0.03em" }}>
          IELTS<span style={{ color: "#9a72ff" }}>Pro</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className="flex items-center gap-3 h-12 px-3 rounded-[14px] font-semibold text-sm transition-all duration-150 cursor-pointer"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)",
                      color: "#fff",
                      boxShadow: "0 10px 22px rgba(159,121,255,0.28)",
                    }
                  : { color: "#353741" }
              }
            >
              <span className={`shrink-0 ${isActive ? "text-white" : "text-[#7b7b8d]"}`}>{item.icon}</span>
              <span className="whitespace-nowrap flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 h-12 px-3 rounded-[14px] text-sm font-semibold text-[#353741] hover:bg-[#efe7ff] transition-colors cursor-pointer w-full"
        >
          <svg className="w-5 h-5 text-[#7b7b8d] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="whitespace-nowrap">Log out</span>
        </button>
      </div>

      <div
        className="mt-4 rounded-[18px] border border-[#ececf3] p-4 text-center"
        style={{ background: "#fff", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl"
          style={{
            background: "radial-gradient(circle at 35% 35%, #423a60 0%, #242232 70%, #1c1b28 100%)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          🚀
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ letterSpacing: "-0.02em", color: "#222225" }}>
          Renew subscription
        </h3>
        <p className="text-xs text-[#7b7b8d] leading-relaxed mb-3">
          Unlimited tests, AI feedback &amp; speaking sessions
        </p>
        <Link
          href="/dashboard/profile"
          className="block w-full py-2.5 rounded-[12px] text-xs font-bold text-white text-center transition-opacity hover:opacity-90"
          style={{ background: "#18191d" }}
        >
          Make payment
        </Link>
      </div>
    </aside>
  );
}
