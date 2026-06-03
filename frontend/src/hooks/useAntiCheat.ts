"use client";

/**
 * useAntiCheat — CBT integrity protections for IELTS test pages.
 *
 * Key behaviours:
 *  - 3-second grace period after mount (avoids false positives during navigation)
 *  - Tab switch via visibilitychange (most reliable)
 *  - Window blur with 800ms debounce (avoids address-bar / DevTools flash)
 *  - Clipboard & context-menu blocking
 *  - DevTools keyboard shortcut blocking
 *  - Violation limit → onLimit callback (auto-submit)
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface AntiCheatOptions {
  enforceFullscreen?: boolean;
  blockClipboard?: boolean;
  blockContextMenu?: boolean;
  blockDevtools?: boolean;
  violationLimit?: number;
  onLimit?: () => void;
  disabled?: boolean;
}

export type ViolationType =
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  | "copy_attempt"
  | "paste_attempt"
  | "cut_attempt"
  | "context_menu"
  | "devtools_shortcut";

export interface Violation {
  type: ViolationType;
  at: number;
  message: string;
}

interface State {
  violations: Violation[];
  lastViolation: Violation | null;
  warningOpen: boolean;
  isFullscreen: boolean;
}

const GRACE_PERIOD_MS = 3000; // wait 3s after mount before tracking

export function useAntiCheat(opts: AntiCheatOptions = {}) {
  const {
    enforceFullscreen = false,
    blockClipboard    = true,
    blockContextMenu  = true,
    blockDevtools     = true,
    violationLimit    = 3,
    onLimit,
    disabled          = false,
  } = opts;

  const [state, setState] = useState<State>({
    violations:    [],
    lastViolation: null,
    warningOpen:   false,
    isFullscreen:  false,
  });

  const limitFiredRef  = useRef(false);
  const activeRef      = useRef(false);   // true after grace period
  const blurTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountTimeRef   = useRef(Date.now());

  // ── Grace period — don't record anything for the first 3 seconds ──────────
  useEffect(() => {
    if (disabled) return;
    mountTimeRef.current = Date.now();
    const t = setTimeout(() => { activeRef.current = true; }, GRACE_PERIOD_MS);
    return () => { clearTimeout(t); activeRef.current = false; };
  }, [disabled]);

  const recordViolation = useCallback((type: ViolationType, message: string) => {
    if (!activeRef.current) return; // still in grace period
    const v: Violation = { type, at: Date.now(), message };
    setState((s) => ({
      ...s,
      violations:    [...s.violations, v],
      lastViolation: v,
      warningOpen:   true,
    }));
  }, []);

  // Fire onLimit once when threshold is crossed
  useEffect(() => {
    if (disabled) return;
    if (!limitFiredRef.current && state.violations.length >= violationLimit) {
      limitFiredRef.current = true;
      // Small delay so the banner renders before auto-submit
      setTimeout(() => onLimit?.(), 1500);
    }
  }, [state.violations.length, violationLimit, onLimit, disabled]);

  // ── Tab switch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        recordViolation(
          "tab_switch",
          "You switched away from the test tab. This has been recorded."
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [disabled, recordViolation]);

  // ── Window blur — debounced 800 ms to avoid false positives ──────────────
  useEffect(() => {
    if (disabled) return;
    const onBlur = () => {
      // Only record if the page is still visible (not just a tab switch)
      if (document.visibilityState !== "visible") return;
      // Debounce: cancel if focus returns within 800 ms
      blurTimerRef.current = setTimeout(() => {
        recordViolation(
          "window_blur",
          "The test window lost focus. Keep the test window active."
        );
      }, 800);
    };
    const onFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };
    window.addEventListener("blur",  onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur",  onBlur);
      window.removeEventListener("focus", onFocus);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [disabled, recordViolation]);

  // ── Clipboard / context-menu / devtools ──────────────────────────────────
  useEffect(() => {
    if (disabled) return;

    const onCopy  = (e: ClipboardEvent) => {
      if (!blockClipboard) return;
      e.preventDefault();
      recordViolation("copy_attempt", "Copying text is not allowed during the test.");
    };
    const onCut = (e: ClipboardEvent) => {
      if (!blockClipboard) return;
      e.preventDefault();
      recordViolation("cut_attempt", "Cutting text is not allowed during the test.");
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!blockClipboard) return;
      e.preventDefault();
      recordViolation("paste_attempt", "Pasting text is not allowed during the test.");
    };
    const onCtx = (e: MouseEvent) => {
      if (!blockContextMenu) return;
      e.preventDefault();
      recordViolation("context_menu", "Right-click is disabled during the test.");
    };
    const onKey = (e: KeyboardEvent) => {
      if (!blockDevtools) return;
      const k = e.key.toLowerCase();
      const isDevtools =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === "i" || k === "j" || k === "c")) ||
        ((e.ctrlKey || e.metaKey) && k === "u");
      if (isDevtools) {
        e.preventDefault();
        recordViolation("devtools_shortcut", "Developer tool shortcuts are blocked during the test.");
      }
      // Also block Ctrl+A select all on some browsers
      if ((e.ctrlKey || e.metaKey) && k === "a" && blockClipboard) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy",        onCopy);
    document.addEventListener("cut",         onCut);
    document.addEventListener("paste",       onPaste);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown",     onKey);
    return () => {
      document.removeEventListener("copy",        onCopy);
      document.removeEventListener("cut",         onCut);
      document.removeEventListener("paste",       onPaste);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown",     onKey);
    };
  }, [disabled, blockClipboard, blockContextMenu, blockDevtools, recordViolation]);

  // ── Fullscreen tracking ───────────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return;
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setState((s) => ({ ...s, isFullscreen: fs }));
      if (enforceFullscreen && !fs) {
        recordViolation("fullscreen_exit", "You exited fullscreen. Please return to fullscreen to continue.");
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [disabled, enforceFullscreen, recordViolation]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) return;
      await document.documentElement.requestFullscreen();
    } catch { /* user denied */ }
  }, []);

  const dismissWarning = useCallback(
    () => setState((s) => ({ ...s, warningOpen: false })),
    []
  );

  const remaining = Math.max(0, violationLimit - state.violations.length);

  return {
    violations:     state.violations,
    violationCount: state.violations.length,
    lastViolation:  state.lastViolation,
    warningOpen:    state.warningOpen,
    isFullscreen:   state.isFullscreen,
    violationLimit,
    remaining,
    isAtLimit:      state.violations.length >= violationLimit,
    enterFullscreen,
    dismissWarning,
  };
}
