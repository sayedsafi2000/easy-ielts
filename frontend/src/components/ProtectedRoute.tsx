"use client";

/**
 * Wraps a protected page. Redirects unauthenticated users to /login (or
 * /admin/login for admin routes) once the auth state has finished loading.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  /** If set, only users with one of these roles may access the page. */
  roles?: Array<"student" | "admin" | "examiner">;
  /** Where to send unauthenticated visitors. */
  redirectTo?: string;
}

export default function ProtectedRoute({ children, roles, redirectTo = "/login" }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(redirectTo); return; }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === "admin" || user.role === "examiner" ? "/admin" : "/dashboard");
    }
  }, [user, loading, roles, redirectTo, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f8fb" }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
             style={{ borderColor: "#efe7ff", borderTopColor: "#9a72ff" }} />
      </div>
    );
  }
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
