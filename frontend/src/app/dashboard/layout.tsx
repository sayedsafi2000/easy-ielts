import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardRightPanel from "@/components/layout/DashboardRightPanel";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={["student", "admin", "examiner"]}>
      <div
        className="grid h-screen overflow-hidden"
        style={{ gridTemplateColumns: "260px minmax(0,1fr) 320px", background: "#fff" }}
      >
        <DashboardSidebar />
        <main className="border-r border-[#ececf3] overflow-y-auto min-w-0 h-screen">
          {children}
        </main>
        <DashboardRightPanel />
      </div>
    </ProtectedRoute>
  );
}
