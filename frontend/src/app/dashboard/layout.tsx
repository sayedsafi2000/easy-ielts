"use client";
import { useState } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardRightPanel from "@/components/layout/DashboardRightPanel";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  return (
    <ProtectedRoute roles={["student", "admin", "examiner"]}>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Mobile Overlay */}
        {(sidebarOpen || rightPanelOpen) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 xl:hidden"
            onClick={() => {
              setSidebarOpen(false);
              setRightPanelOpen(false);
            }}
          />
        )}

        {/* Sidebar - Desktop: always visible, Mobile/Tablet: sliding drawer */}
        <div
          className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-auto transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ width: "260px" }}
        >
          <DashboardSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Mobile/Tablet Header */}
          <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[#ececf3] bg-white sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold text-slate-900">IELTS<span className="text-purple-600">Pro</span></span>
            <button
              onClick={() => setRightPanelOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Open profile"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>

        {/* Right Panel - Only visible on XL screens (1280px+), Mobile: sliding drawer */}
        <div
          className={`fixed xl:sticky top-0 right-0 h-screen z-50 xl:z-auto transition-transform duration-300 xl:translate-x-0 ${
            rightPanelOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"
          }`}
          style={{ width: "320px" }}
        >
          <DashboardRightPanel onClose={() => setRightPanelOpen(false)} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
