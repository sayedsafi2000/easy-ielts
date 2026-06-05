"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>("/api/notifications");
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch { /* not logged in / ignore */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openItem(n: Notification) {
    if (!n.read_at) {
      try { await api.post(`/api/notifications/${n.id}/read`); } catch { /* ignore */ }
    }
    setOpen(false);
    await load();
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    try { await api.post("/api/notifications/read-all"); } catch { /* ignore */ }
    await load();
  }

  const iconColor = tone === "dark" ? "#fff" : "#7b7b8d";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-[12px] border border-[#ececf3] bg-white grid place-items-center hover:bg-[#efe7ff] transition-colors cursor-pointer"
        style={{ color: iconColor === "#fff" ? "#7b7b8d" : iconColor }}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "#ff4d59" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-[16px] z-50 overflow-hidden" style={{ border: "1px solid #ececf3", boxShadow: "0 20px 40px rgba(32,28,54,0.16)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #f1f1f7" }}>
            <span className="text-sm font-bold text-[#222225]">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-semibold cursor-pointer" style={{ color: "#9a72ff" }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: "#a4a4b5" }}>No notifications</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className="w-full text-left px-4 py-3 flex gap-3 hover:bg-[#fafafe] transition-colors cursor-pointer"
                  style={{ borderBottom: "1px solid #f6f7fb", background: n.read_at ? "white" : "#faf7ff" }}
                >
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: n.read_at ? "transparent" : "#9a72ff" }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-[#222225]">{n.title}</span>
                    {n.body && <span className="block text-xs text-[#7b7b8d] mt-0.5 line-clamp-2">{n.body}</span>}
                    <span className="block text-[11px] text-[#a4a4b5] mt-1">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
