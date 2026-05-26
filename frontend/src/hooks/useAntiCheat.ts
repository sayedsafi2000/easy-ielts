"use client";

/**
 * useAntiCheat — bundle of CBT integrity protections used by the test pages.
 *
 * - Detects tab/window switches via the visibilitychange event.
 * - Detects window blur (alt-tab, clicking outside the browser).
 * - Blocks copy / paste / cut / contextmenu inside the test container.
 * - Blocks common dev-tools shortcuts (F12, Ctrl+Shift+I/J, Ctrl+U).
 * - Optionally enforces fullscreen and warns when the user leaves it.
 * - Counts violations and triggers an auto-submit callback after a threshold.
 *
 * All behaviour is opt-in via the options object so the same hook can be
 * used from every test module with module-specific tuning.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface AntiCheatOptions {
  /** When true, switch to fullscreen on first user interaction. */
  enforceFullscreen?: boolean;
  /** Block copy/cut/paste keyboard + clipboard events. */
  blockClipboard?: boolean;
  /** Block right-click context menu. */
  blockContextMenu?: boolean;
  /** Block dev-tools shortcuts (best-effort — cannot truly prevent dev tools). */
  blockDevtools?: boolean;
  /** How many violations before we trigger onLimit (default 3). */
  violationLimit?: number;
  /** Called when the violation count crosses violationLimit. */
  onLimit?: () => void;
  /** Disable everything — useful while the page is still loading. */
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
    violations: [],
    lastViolation: null,
    warningOpen: false,
    isFullscreen: false,
  });

  const limitFiredRef = useRef(false);

  const recordViolation = useCallback(
    (type: ViolationType, message: string) => {
      const v: Violation = { type, at: Date.now(), message };
      setState((s) => {
        const next = { ...s, violations: [...s.violations, v], lastViolation: v, warningOpen: true };
        return next;
      });
    },
    []
  );

  // Fire onLimit once when threshold is reached
  useEffect(() => {
    if (disabled) return;
    if (!limitFiredRef.current && state.violations.length >= violationLimit) {
      limitFiredRef.current = true;
      onLimit?.();
    }
  }, [state.violations.length, violationLimit, onLimit, disabled]);

  // Visibility / blur tracking
  useEffect(() => {
    if (disabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        recordViolation("tab_switch", "You left the test tab. Returning to the test is fine, but repeated switches will auto-submit your test.");
      }
    };
    const onBlur = () => {
      // Some browsers fire blur without changing visibility (e.g. alt-tab).
      if (document.visibilityState === "visible") {
        recordViolation("window_blur", "The test window lost focus. Keep the test window in the foreground.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [disabled, recordViolation]);

  // Clipboard / context-menu / devtools blocking
  useEffect(() => {
    if (disabled) return;

    const onCopy  = (e: ClipboardEvent) => { if (!blockClipboard) return; e.preventDefault(); recordViolation("copy_attempt",  "Copying is disabled during the test."); };
    const onCut   = (e: ClipboardEvent) => { if (!blockClipboard) return; e.preventDefault(); recordViolation("cut_attempt",   "Cutting is disabled during the test."); };
    const onPaste = (e: ClipboardEvent) => { if (!blockClipboard) return; e.preventDefault(); recordViolation("paste_attempt", "Pasting is disabled during the test."); };
    const onCtx   = (e: MouseEvent)     => { if (!blockContextMenu) return; e.preventDefault(); recordViolation("context_menu",  "The right-click menu is disabled during the test."); };
    const onKey   = (e: KeyboardEvent) => {
      if (!blockDevtools) return;
      const k = e.key.toLowerCase();
      const isDevtools =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === "i" || k === "j" || k === "c")) ||
        ((e.ctrlKey || e.metaKey) && k === "u");
      if (isDevtools) {
        e.preventDefault();
        recordViolation("devtools_shortcut", "Developer-tool shortcuts are disabled during the test.");
      }
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey);
    };
  }, [disabled, blockClipboard, blockContextMenu, blockDevtools, recordViolation]);

  // Fullscreen tracking
  useEffect(() => {
    if (disabled) return;
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setState((s) => ({ ...s, isFullscreen: fs }));
      if (enforceFullscreen && !fs) {
        recordViolation("fullscreen_exit", "You exited fullscreen mode. Please return to fullscreen to continue.");
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [disabled, enforceFullscreen, recordViolation]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) return;
      await document.documentElement.requestFullscreen();
    } catch {
      /* user denied — not fatal */
    }
  }, []);

  const dismissWarning = useCallback(
    () => setState((s) => ({ ...s, warningOpen: false })),
    []
  );

  return {
    violations:    state.violations,
    violationCount: state.violations.length,
    lastViolation: state.lastViolation,
    warningOpen:   state.warningOpen,
    isFullscreen:  state.isFullscreen,
    violationLimit,
    enterFullscreen,
    dismissWarning,
  };
}
