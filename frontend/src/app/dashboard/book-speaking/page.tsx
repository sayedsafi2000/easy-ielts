"use client";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// Calendar — dynamic: always shows current + next month rolling
const NOW      = new Date();
const CUR_YEAR = NOW.getFullYear();
const CUR_MONTH = NOW.getMonth(); // 0-indexed
const TODAY_D  = NOW.getDate();

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// We show the calendar for whatever month+year is selected
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
// 0=Sun..6=Sat → Mon-first offset
function monthOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7; // 0=Mon
}
function isWeekendDate(year: number, month: number, date: number) {
  const d = new Date(year, month, date).getDay();
  return d === 0 || d === 6;
}
function isAvailableDate(year: number, month: number, date: number) {
  const d = new Date(year, month, date);
  const today = new Date(CUR_YEAR, CUR_MONTH, TODAY_D);
  return d > today && !isWeekendDate(year, month, date);
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Dialer config
const ITEM_H = 56;
const HOURS   = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MINS    = ["00","15","30","45"];
const PERIODS = ["AM","PM"];

type DialHandle = { focus: () => void };

type DialProps = {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
  isFocused: boolean;
  onFocus: () => void;
  onShift: (dir: -1 | 1) => void;
};

const Dial = forwardRef<DialHandle, DialProps>(function Dial(
  { values, value, onChange, label, isFocused, onFocus, onShift },
  ref
) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dragRef = useRef<{ startY: number; startScroll: number } | null>(null);
  const [displayIdx, setDisplayIdx] = useState(() => values.indexOf(value));
  const [dragging, setDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => outerRef.current?.focus(),
  }));

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.scrollTop = values.indexOf(value) * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const snap = () => {
      const idx = Math.max(0, Math.min(Math.round(inner.scrollTop / ITEM_H), values.length - 1));
      inner.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      setDisplayIdx(idx);
      onChange(values[idx]);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      inner.scrollTop += e.deltaY;
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      inner.scrollTop += touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
    };

    outer.addEventListener("wheel", onWheel, { passive: false });
    outer.addEventListener("touchstart", onTouchStart, { passive: true });
    outer.addEventListener("touchmove", onTouchMove, { passive: false });
    outer.addEventListener("touchend", snap);

    return () => {
      outer.removeEventListener("wheel", onWheel);
      outer.removeEventListener("touchstart", onTouchStart);
      outer.removeEventListener("touchmove", onTouchMove);
      outer.removeEventListener("touchend", snap);
    };
  }, [values, onChange]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !innerRef.current) return;
      const delta = dragRef.current.startY - e.clientY;
      innerRef.current.scrollTop = dragRef.current.startScroll + delta;
    };

    const onMouseUp = () => {
      if (!dragRef.current || !innerRef.current) return;
      dragRef.current = null;
      setDragging(false);
      const inner = innerRef.current;
      const idx = Math.max(0, Math.min(Math.round(inner.scrollTop / ITEM_H), values.length - 1));
      inner.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      setDisplayIdx(idx);
      onChange(values[idx]);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [values, onChange]);

  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx !== -1 && idx !== displayIdx) {
      setDisplayIdx(idx);
      innerRef.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    const el = innerRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), values.length - 1));
    setDisplayIdx(idx);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      onChange(values[idx]);
    }, 150);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!innerRef.current) return;
    dragRef.current = { startY: e.clientY, startScroll: innerRef.current.scrollTop };
    setDragging(true);
    onFocus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const inner = innerRef.current;
    if (!inner) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.max(0, displayIdx - 1);
      inner.scrollTo({ top: newIdx * ITEM_H, behavior: "smooth" });
      setDisplayIdx(newIdx);
      onChange(values[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.min(values.length - 1, displayIdx + 1);
      inner.scrollTo({ top: newIdx * ITEM_H, behavior: "smooth" });
      setDisplayIdx(newIdx);
      onChange(values[newIdx]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onShift(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onShift(1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="text-xs font-semibold uppercase tracking-widest transition-colors"
        style={{ color: isFocused ? "#9a72ff" : "#a4a4b5" }}
      >
        {label}
      </span>
      <div
        ref={outerRef}
        tabIndex={0}
        onFocus={onFocus}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        className="relative rounded-2xl overflow-hidden select-none outline-none transition-shadow"
        style={{
          width: 96,
          height: ITEM_H * 5,
          background: "#f6f7fb",
          cursor: dragging ? "grabbing" : "grab",
          boxShadow: isFocused ? "0 0 0 2.5px #9a72ff" : "none",
        }}
      >
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{ zIndex: 0, top: ITEM_H * 2, height: ITEM_H, background: "#efe7ff", borderTop: "1.5px solid #ddd0ff", borderBottom: "1.5px solid #ddd0ff" }}
        />
        <div
          ref={innerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll"
          style={{ zIndex: 10, scrollbarWidth: "none", paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2 }}
        >
          {values.map((v, i) => (
            <div
              key={v}
              className="flex items-center justify-center"
              style={{
                height: ITEM_H,
                color: i === displayIdx ? "#6a45d0" : "#c4c4d0",
                fontSize: i === displayIdx ? "1.75rem" : "1.1rem",
                fontWeight: i === displayIdx ? 700 : 500,
                transition: "color 0.1s, font-size 0.15s",
              }}
            >
              {v}
            </div>
          ))}
        </div>
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ zIndex: 20, height: ITEM_H * 2, background: "linear-gradient(to bottom, #f6f7fb 30%, transparent)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ zIndex: 20, height: ITEM_H * 2, background: "linear-gradient(to top, #f6f7fb 30%, transparent)" }}
        />
      </div>
      <span
        className="text-xs transition-opacity"
        style={{ color: "#b4a4e0", opacity: isFocused ? 1 : 0 }}
      >
        ↑ ↓ to change
      </span>
    </div>
  );
});

export default function BookSpeakingPage() {
  // Dynamic calendar state
  const [calYear,  setCalYear]  = useState(CUR_YEAR);
  const [calMonth, setCalMonth] = useState(CUR_MONTH);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const offset      = monthOffset(calYear, calMonth);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [focusedCalDate, setFocusedCalDate] = useState<number | null>(null);
  const [hour, setHour] = useState("10");
  const [min, setMin] = useState("00");
  const [period, setPeriod] = useState("AM");

  // Booking submission
  const [submitted,   setSubmitted]   = useState(false);
  const [booking,     setBooking]     = useState(false);
  const [bookingError, setBookingError] = useState("");

  const [focusedDial, setFocusedDial] = useState<number | null>(null);

  const calBtnRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (focusedCalDate !== null) {
      calBtnRefs.current.get(focusedCalDate)?.focus();
    }
  }, [focusedCalDate]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  }

  const handleCalKeyDown = (e: React.KeyboardEvent, date: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = Math.min(daysInMonth, date + 1);
    else if (e.key === "ArrowLeft") next = Math.max(1, date - 1);
    else if (e.key === "ArrowDown") next = Math.min(daysInMonth, date + 7);
    else if (e.key === "ArrowUp") next = Math.max(1, date - 7);
    else if ((e.key === "Enter" || e.key === " ") && isAvailableDate(calYear, calMonth, date)) {
      e.preventDefault();
      setSelectedDate(date);
      return;
    }

    if (next !== null) {
      e.preventDefault();
      setFocusedCalDate(next);
    }
  };

  const dialRef0 = useRef<DialHandle>(null);
  const dialRef1 = useRef<DialHandle>(null);
  const dialRef2 = useRef<DialHandle>(null);
  const dialRefs = [dialRef0, dialRef1, dialRef2];

  const handleShift = (from: number, dir: -1 | 1) => {
    const next = Math.max(0, Math.min(2, from + dir));
    setFocusedDial(next);
    dialRefs[next].current?.focus();
  };

  // First available date gets tabIndex=0 as the calendar entry point
  const firstAvailable = Array.from({ length: daysInMonth }, (_, i) => i + 1).find(d => isAvailableDate(calYear, calMonth, d)) ?? 1;
  const calTabTarget = focusedCalDate ?? selectedDate ?? firstAvailable;

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#dff1e8" }}>
          <svg className="w-8 h-8" style={{ color: "#2a9350" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Booking request sent!</h2>
        <p className="mt-2 text-sm text-[#7b7b8d]">
          Your request for <strong>{MONTH_NAMES[calMonth]} {selectedDate}, {calYear}</strong> at <strong>{hour}:{min} {period}</strong> has been sent. Admin will confirm within 24 hours.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/dashboard" className="text-sm font-bold cursor-pointer px-5 py-2.5 rounded-[14px]" style={{ color: "#434552", background: "white", border: "1px solid #dedee8" }}>
            Back to dashboard
          </Link>
          <button
            onClick={() => { setSubmitted(false); setSelectedDate(null); setHour("10"); setMin("00"); setPeriod("AM"); setFocusedCalDate(null); setBookingError(""); }}
            className="text-white text-sm font-bold px-5 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            Book another slot
          </button>
        </div>
      </div>
    );
  }

  const totalRows = Math.ceil((daysInMonth + offset) / 7);

  async function handleConfirmBooking() {
    if (!selectedDate) return;
    setBookingError("");
    setBooking(true);
    try {
      // Build ISO scheduled_at from picked date + time
      let h = parseInt(hour, 10);
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      const scheduled_at = new Date(calYear, calMonth, selectedDate, h, parseInt(min, 10)).toISOString();
      await api.post("/api/bookings", { scheduled_at });
      setSubmitted(true);
    } catch (e: any) {
      setBookingError(e?.message ?? "Failed to book session. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>Book Speaking Session</h1>
        <p className="text-sm text-[#7b7b8d] mt-1">Pick a date and time. Admin will confirm within 24 hours.</p>
      </div>

      {bookingError && (
        <div className="mb-6 rounded-[14px] px-4 py-3 text-sm font-medium" style={{ background: "#fff0f0", color: "#ff4d59", border: "1px solid #ffd0d3" }}>
          {bookingError}
        </div>
      )}

      {/* Info banner */}
      <div className="rounded-[14px] p-4 flex gap-3 mb-8" style={{ background: "#efe7ff", border: "1px solid #ddd0ff" }}>
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#6a45d0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm" style={{ color: "#6a45d0" }}>
          Speaking sessions are a live video call with your examiner. Each session lasts approximately 15 minutes. Ensure you have a stable internet connection and a quiet environment.
        </p>
      </div>

      {/* Calendar */}
      <div
        role="grid"
        aria-label={`${MONTH_NAMES[calMonth]} ${calYear}`}
        className="bg-white rounded-[20px] overflow-hidden mb-6"        style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#f6f7fb", borderBottom: "1px solid #f1f1f7" }}>
          <h2 className="text-sm font-semibold text-[#222225]">{MONTH_NAMES[calMonth]} {calYear}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-[#ececf3] cursor-pointer text-[#7b7b8d] transition-colors" aria-label="Previous month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-[#ececf3] cursor-pointer text-[#7b7b8d] transition-colors" aria-label="Next month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 mb-2" role="row">
            {DAYS.map((d) => (
              <div key={d} role="columnheader" className="text-center text-xs font-semibold py-2" style={{ color: "#7b7b8d" }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: totalRows * 7 }).map((_, ci) => {
              const date = ci - offset + 1;
              const valid = date >= 1 && date <= daysInMonth;
              const isToday = calYear === CUR_YEAR && calMonth === CUR_MONTH && date === TODAY_D;
              const available = valid && isAvailableDate(calYear, calMonth, date);
              const isSelected = selectedDate === date;
              const isFocused = focusedCalDate === date;

              if (!valid) return <div key={ci} role="gridcell" className="h-12 rounded-[12px]" />;

              return (
                <button
                  key={ci}
                  ref={(el) => {
                    if (el) calBtnRefs.current.set(date, el);
                    else calBtnRefs.current.delete(date);
                  }}
                  role="gridcell"
                  aria-label={`${MONTH_NAMES[calMonth]} ${date}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}${!available ? ", unavailable" : ""}`}
                  aria-selected={isSelected}
                  aria-disabled={!available}
                  tabIndex={date === calTabTarget ? 0 : -1}
                  onClick={() => {
                    if (available) {
                      setSelectedDate(date);
                      setFocusedCalDate(date);
                    }
                  }}
                  onFocus={() => setFocusedCalDate(date)}
                  onKeyDown={(e) => handleCalKeyDown(e, date)}
                  className="h-12 rounded-[12px] text-sm font-semibold transition-all flex items-center justify-center relative outline-none"
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white", boxShadow: "0 6px 16px rgba(159,121,255,0.35)", cursor: "pointer" }
                      : isFocused && available
                      ? { background: "#efe7ff", color: "#6a45d0", boxShadow: "0 0 0 2px #9a72ff", cursor: "pointer" }
                      : isToday
                      ? { background: "#efe7ff", color: "#6a45d0", border: "1.5px solid #ddd0ff", cursor: "default" }
                      : !available
                      ? { background: "#f6f7fb", color: "#d0d0dc", cursor: "default" }
                      : { background: "#f6f7fb", color: "#222225", cursor: "pointer" }
                  }
                >
                  {date}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "#9a72ff" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time dialer */}
      {selectedDate && (
        <div className="bg-white rounded-[20px] p-8 mb-6" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <h3 className="text-sm font-semibold text-[#222225] mb-8 text-center">Pick a time — {MONTH_NAMES[calMonth]} {selectedDate}</h3>
          <div className="flex items-start justify-center gap-2">
            <Dial
              ref={dialRef0}
              values={HOURS}
              value={hour}
              onChange={setHour}
              label="Hour"
              isFocused={focusedDial === 0}
              onFocus={() => setFocusedDial(0)}
              onShift={(dir) => handleShift(0, dir)}
            />
            <span className="text-3xl font-bold select-none" style={{ color: "#ececf3", marginTop: "calc(56px * 2 + 28px)" }}>:</span>
            <Dial
              ref={dialRef1}
              values={MINS}
              value={min}
              onChange={setMin}
              label="Min"
              isFocused={focusedDial === 1}
              onFocus={() => setFocusedDial(1)}
              onShift={(dir) => handleShift(1, dir)}
            />
            <div className="w-4" />
            <Dial
              ref={dialRef2}
              values={PERIODS}
              value={period}
              onChange={setPeriod}
              label="AM / PM"
              isFocused={focusedDial === 2}
              onFocus={() => setFocusedDial(2)}
              onShift={(dir) => handleShift(2, dir)}
            />
          </div>
          <p className="text-center text-sm font-semibold mt-8" style={{ color: "#9a72ff" }}>
            {hour}:{min} {period} selected
          </p>
        </div>
      )}

      {/* Booking summary */}
      {selectedDate && (
        <div className="bg-white rounded-[20px] p-5 flex items-center justify-between" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <div>
            <p className="text-sm font-semibold text-[#222225]">Booking summary</p>
            <p className="text-sm text-[#7b7b8d] mt-0.5">{MONTH_NAMES[calMonth]} {selectedDate}, {calYear} at {hour}:{min} {period} — Speaking Session (15 min)</p>
          </div>
          <button
            onClick={handleConfirmBooking}
            disabled={booking}
            className="text-white text-sm font-bold px-6 py-2.5 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }}
          >
            {booking ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      )}
    </div>
  );
}
