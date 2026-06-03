"use client";

/**
 * AntiCheatBanner — warning overlay shown when a test integrity violation is
 * detected. Matches the British-Council exam UI palette.
 *
 * - 1st/2nd violation: yellow dismissible banner with countdown
 * - 3rd violation (limit): full-screen red overlay, auto-dismisses after 3 s
 *   then triggers auto-submit
 */
import { useEffect, useState } from "react";
import type { Violation } from "@/hooks/useAntiCheat";

interface Props {
  open: boolean;
  violation: Violation | null;
  count: number;
  limit: number;
  onDismiss: () => void;
}

const VIOLATION_LABELS: Record<string, string> = {
  tab_switch:       "Tab Switch Detected",
  window_blur:      "Window Lost Focus",
  fullscreen_exit:  "Fullscreen Exited",
  copy_attempt:     "Copy Attempt Blocked",
  paste_attempt:    "Paste Attempt Blocked",
  cut_attempt:      "Cut Attempt Blocked",
  context_menu:     "Right-Click Blocked",
  devtools_shortcut:"Dev Tools Shortcut Blocked",
};

export default function AntiCheatBanner({ open, violation, count, limit, onDismiss }: Props) {
  const isAtLimit = count >= limit;
  const remaining = Math.max(0, limit - count);

  // Auto-dismiss countdown for the final-warning screen (3 s)
  const [countdown, setCountdown] = useState(3);
  useEffect(() => {
    if (!open || !isAtLimit) return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); onDismiss(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAtLimit]);

  if (!open || !violation) return null;

  const label = VIOLATION_LABELS[violation.type] ?? "Integrity Violation";

  /* ── FINAL WARNING: full-screen red overlay ──────────────────────────── */
  if (isAtLimit) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Test auto-submitting"
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(180,0,0,0.97)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "Arial, sans-serif", color: "#fff",
          padding: 32, textAlign: "center",
        }}
      >
        {/* Siren icon */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>🚨</div>

        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>
          TEST INTEGRITY VIOLATION
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, opacity: 0.85 }}>
          {label}
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
            padding: "16px 32px", marginBottom: 28, maxWidth: 540,
            fontSize: 14, lineHeight: 1.7,
          }}
        >
          You have exceeded the maximum number of allowed violations ({limit}).
          <br />
          <strong>Your test is being submitted automatically.</strong>
        </div>

        {/* Countdown ring */}
        <div
          style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, marginBottom: 16,
          }}
        >
          {countdown}
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Submitting in {countdown} second{countdown !== 1 ? "s" : ""}…</div>
      </div>
    );
  }

  /* ── STANDARD WARNING: top banner ────────────────────────────────────── */
  return (
    <div
      role="alert"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        background: remaining === 1 ? "#ff6b00" : "#fff3cd",
        color:      remaining === 1 ? "#fff"    : "#7a4000",
        borderBottom: remaining === 1 ? "3px solid #c84b00" : "2px solid #d47600",
        padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 16,
        fontFamily: "Arial, sans-serif", fontSize: 13,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 22, flexShrink: 0 }}>
        {remaining === 1 ? "⚠️" : "🔔"}
      </span>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, marginBottom: 3, fontSize: 14 }}>
          {label}
        </div>
        <div style={{ lineHeight: 1.5 }}>
          {violation.message}
          <span style={{ marginLeft: 8, fontWeight: 700 }}>
            [{count}/{limit} warnings
            {remaining > 0 ? ` — ${remaining} remaining before auto-submit` : ""}]
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 12, borderRadius: "50%",
              background: i < count
                ? (remaining === 1 ? "#fff" : "#d47600")
                : "rgba(0,0,0,0.15)",
              border: `2px solid ${remaining === 1 ? "rgba(255,255,255,0.5)" : "#d47600"}`,
            }}
          />
        ))}
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss warning"
        style={{
          background: remaining === 1 ? "rgba(255,255,255,0.2)" : "#d47600",
          color: "#fff",
          border: "none", padding: "6px 16px",
          fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
