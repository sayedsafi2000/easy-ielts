"use client";

/**
 * Visual warning banner shown when an anti-cheat violation is detected.
 *
 * Uses the same British-Council-style colour palette as the test pages so it
 * blends visually with the existing exam UI (no design changes elsewhere).
 */
import type { Violation } from "@/hooks/useAntiCheat";

interface Props {
  open: boolean;
  violation: Violation | null;
  count: number;
  limit: number;
  onDismiss: () => void;
}

export default function AntiCheatBanner({ open, violation, count, limit, onDismiss }: Props) {
  if (!open || !violation) return null;
  const remaining = Math.max(0, limit - count);
  const critical = remaining === 0;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: critical ? "#cc0000" : "#fff3cd",
        color: critical ? "#fff" : "#7a4000",
        borderBottom: critical ? "2px solid #990000" : "2px solid #d47600",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: "Arial, sans-serif",
        fontSize: 13,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", marginBottom: 2 }}>
          {critical ? "Test will be auto-submitted" : "Test integrity warning"}
        </strong>
        <span>
          {violation.message}
          {!critical && (
            <> &nbsp;<em>({count} of {limit} allowed — {remaining} remaining)</em></>
          )}
        </span>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: critical ? "#fff" : "#d47600",
          color: critical ? "#cc0000" : "#fff",
          border: "none",
          padding: "5px 14px",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
