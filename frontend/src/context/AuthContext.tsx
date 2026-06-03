"use client";

/**
 * Auth context — fetches the current user from /api/auth/me on mount and
 * exposes login / register / logout helpers that update the store.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@/types";

interface AuthState {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: Profile; role: string }>;
  register: (email: string, password: string, full_name: string) => Promise<{ user: Profile; role: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: Profile }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // If redirected back from Google OAuth, refresh auth state from cookie
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("google") === "1") {
        // Remove the param from URL without page reload
        const url = new URL(window.location.href);
        url.searchParams.delete("google");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: Profile; role: string; token: string }>(
      "/api/auth/login",
      { email, password }
    );
    if (typeof window !== "undefined" && data.token) {
      window.localStorage.setItem("eielts_token", data.token);
    }
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email: string, password: string, full_name: string) => {
    const data = await api.post<{ user: Profile; role: string; token: string }>(
      "/api/auth/register",
      { email, password, full_name }
    );
    if (typeof window !== "undefined" && data.token) {
      window.localStorage.setItem("eielts_token", data.token);
    }
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/api/auth/logout"); } catch { /* ignore */ }
    if (typeof window !== "undefined") window.localStorage.removeItem("eielts_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
