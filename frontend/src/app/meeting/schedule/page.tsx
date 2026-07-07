"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* Zoom's exact font stack, letter-spacing and eased motion curve */
const FONT_STACK = '"Almaden Sans", Helvetica, Arial';
const BODY_LETTER_SPACING = "0.42px";
const ZOOM_EASE = [0.23, 1, 0.32, 1] as const;

/* ============================================
   TYPES
   ============================================ */

type VideoSetting = "on" | "off";
type EncryptionType = "enhanced" | "e2e";
type MeetingIDType = "auto" | "personal";

/* ============================================
   SMALL INLINE SVGS / ICON HELPERS
   ============================================ */

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="#555b62"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="11"
        rx="1.5"
        stroke="#555b62"
        strokeWidth="1.2"
      />
      <path d="M2 6h12" stroke="#555b62" strokeWidth="1.2" />
      <path
        d="M5 1.5v3M11 1.5v3"
        stroke="#555b62"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block align-middle ml-1 shrink-0"
    >
      <circle cx="7" cy="7" r="6" stroke="#555b62" strokeWidth="1.2" />
      <path
        d="M7 6.5v4"
        stroke="#555b62"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="4.5" r="0.7" fill="#555b62" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block align-middle mr-1"
    >
      <path
        d="M7 1.5L2.5 3.5v4c0 2.5 2 4.5 4.5 5 2.5-.5 4.5-2.5 4.5-5v-4L7 1.5z"
        stroke="#22c55e"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M5 7l1.5 1.5 2.5-2.5"
        stroke="#22c55e"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 mt-px"
    >
      <path
        d="M8 1.5L1.5 13h13L8 1.5z"
        stroke="#e1a444"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M8 6v3.5"
        stroke="#e1a444"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="0.7" fill="#e1a444" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="inline-block align-middle ml-1"
    >
      <path
        d="M7 1h4v4M5 7l6-6M3 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V9"
        stroke="#0d6bde"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M10 3L5 8l5 5"
        stroke="#0d6bde"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.099zm-5.242 1.156a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
    </svg>
  );
}

function IconWhiteboard() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block mr-1.5"
    >
      <rect
        x="1"
        y="1"
        width="12"
        height="10"
        rx="1.2"
        stroke="#0d6bde"
        strokeWidth="1.2"
      />
      <path
        d="M1 10h12M4 10v2M10 10v2M4 12h6"
        stroke="#0d6bde"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block mr-1.5"
    >
      <path
        d="M3 1h6l3 3v9H3V1z"
        stroke="#0d6bde"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9 1v3h3"
        stroke="#0d6bde"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 7h4M5 9h3"
        stroke="#0d6bde"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      className="inline-block mr-1"
    >
      <path
        d="M6.5 1l1.4 3.5H11L8.5 6.6l1 3.4-3-2-3 2 1-3.4L2 4.5h3.1L6.5 1z"
        stroke="#0b5cff"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================
   REUSABLE FORM COMPONENTS
   ============================================ */

function FormRow({
  label,
  required,
  children,
  alignTop = false,
  labelIcon,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  alignTop?: boolean;
  labelIcon?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-row gap-[10px] mb-[25px] ${alignTop ? "items-start" : "items-start"}`}
    >
      <div
        className="shrink-0 pt-[6px] flex items-center gap-0"
        style={{ width: 160, minWidth: 160 }}
      >
        {required && (
          <span className="text-[#e02020] mr-0.5 text-[14px]">*</span>
        )}
        <span
          className="text-[14px]"
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 400,
            lineHeight: "18px",
            letterSpacing: BODY_LETTER_SPACING,
            color: "#222325",
          }}
        >
          {label}
        </span>
        {labelIcon && labelIcon}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ZoomInput({
  value,
  onChange,
  placeholder,
  className = "",
  autoFocus,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`h-[32px] bg-white text-[14px] text-[#222325] px-[11px] rounded-[12px] outline-none transition-colors w-full ${className}`}
      style={{
        border: focused ? "1px solid #4b96f1" : "1px solid #c1c6ce",
        boxShadow: focused ? "#4b96f1 0px 0px 0px 1px inset" : "none",
        fontFamily: FONT_STACK,
        fontWeight: 400,
        lineHeight: "18px",
        letterSpacing: BODY_LETTER_SPACING,
      }}
    />
  );
}

type OptionShape = { value: string; label: React.ReactNode };

function ZoomSelect({
  value,
  onChange,
  children,
  width,
  disabled = false,
}: {
  value?: string;
  onChange?: (v: string) => void;
  children: React.ReactNode;
  width?: number | string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options: OptionShape[] = Children.toArray(children)
    .filter(isValidElement)
    .map((c) => {
      const props = (
        c as React.ReactElement<{ value: string; children: React.ReactNode }>
      ).props;
      return { value: String(props.value ?? ""), label: props.children };
    });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);
  const activeBorder = open ? "#4b96f1" : "#c1c6ce";

  return (
    <div
      ref={rootRef}
      className="relative inline-block"
      style={{ width: width || "auto" }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="h-[32px] w-full bg-white text-left pl-[11px] pr-[30px] rounded-[12px] outline-none flex items-center transition-colors disabled:cursor-not-allowed"
        style={{
          border: disabled
            ? "1px solid rgba(173,177,184,0.25)"
            : `1px solid ${activeBorder}`,
          boxShadow: open ? "#4b96f1 0px 0px 0px 1px inset" : "none",
          fontFamily: FONT_STACK,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "18px",
          letterSpacing: BODY_LETTER_SPACING,
          color: disabled ? "rgba(35,35,51,0.4)" : "#222325",
        }}
      >
        <span className="truncate">{current?.label ?? ""}</span>
      </button>
      <motion.div
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2, ease: ZOOM_EASE }}
        className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2"
      >
        <IconChevronDown />
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3, ease: ZOOM_EASE }}
            style={{ transformOrigin: "center top", minWidth: "100%" }}
            className="absolute left-0 top-[36px] z-50"
          >
            <ul
              role="listbox"
              className="bg-white p-[6px] max-h-[280px] overflow-y-auto"
              style={{
                border: "1px solid #dfe3e8",
                borderRadius: 12,
                boxShadow:
                  "rgba(0, 0, 0, 0.08) 0px 12px 24px 0px, rgba(0, 0, 0, 0.08) 0px 6px 12px 0px",
                fontFamily: FONT_STACK,
              }}
            >
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <li
                    key={o.value}
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange?.(o.value);
                      setOpen(false);
                    }}
                    className={`flex items-center h-[32px] px-[8px] rounded-[8px] cursor-pointer text-[14px] transition-colors ${
                      selected
                        ? "bg-[#e3edff] text-[#0d6bde]"
                        : "text-[#232333] hover:bg-[#f5f6f7]"
                    }`}
                    style={{
                      letterSpacing: BODY_LETTER_SPACING,
                      fontWeight: selected ? 500 : 400,
                      lineHeight: "20px",
                    }}
                  >
                    <span className="truncate">{o.label}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================
   ZOOM CALENDAR (custom date picker)
   ============================================ */

function NavBtn({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[#555b62] hover:bg-[#f5f6f7] transition-colors"
    >
      {children}
    </button>
  );
}

function ChevronSingle({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {dir === "left" ? (
        <path
          d="M10 3L5 8l5 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 3l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function ChevronDouble({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {dir === "left" ? (
        <>
          <path
            d="M8 3L3 8l5 5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 3L8 8l5 5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M3 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function parseMDY(s: string): Date | null {
  const parts = s.split("/").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[2], parts[0] - 1, parts[1]);
}

function formatMDY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ZoomCalendar({
  value,
  onChange,
  width = 240,
}: {
  value: string;
  onChange: (v: string) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = parseMDY(value) ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const selected = parseMDY(value);
  const today = new Date();
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      date: new Date(viewYear, viewMonth + 1, nextDay++),
      inMonth: false,
    });
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", {
    month: "long",
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const activeBorder = open ? "#4b96f1" : "#c1c6ce";

  return (
    <div ref={rootRef} className="relative" style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose date"
        className="h-[32px] w-full bg-white pl-[11px] pr-[36px] text-left rounded-[12px] outline-none transition-colors flex items-center"
        style={{
          border: `1px solid ${activeBorder}`,
          boxShadow: open ? "#4b96f1 0px 0px 0px 1px inset" : "none",
          color: "#222325",
          fontFamily: FONT_STACK,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "18px",
          letterSpacing: BODY_LETTER_SPACING,
        }}
      >
        {value}
      </button>
      <div className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2">
        <IconCalendar />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3, ease: ZOOM_EASE }}
            style={{ transformOrigin: "center top" }}
            className="absolute left-0 top-[36px] z-50"
          >
            <div
              role="dialog"
              aria-label="Choose Date"
              className="w-[280px] bg-white"
              style={{
                border: "1px solid #dfe3e8",
                borderRadius: 16,
                boxShadow:
                  "rgba(0, 0, 0, 0.08) 0px 4px 8px 0px, rgba(0, 0, 0, 0.08) 0px 2px 4px 0px",
                fontFamily: FONT_STACK,
                padding: "12px 16px 16px 16px",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between h-[24px] mb-[8px]">
                <div className="flex items-center gap-[2px]">
                  <NavBtn
                    onClick={() => setViewYear((y) => y - 1)}
                    ariaLabel="Previous year"
                  >
                    <ChevronDouble dir="left" />
                  </NavBtn>
                  <NavBtn onClick={prevMonth} ariaLabel="Previous month">
                    <ChevronSingle dir="left" />
                  </NavBtn>
                </div>
                <div
                  className="text-[14px] font-[600]"
                  style={{
                    color: "#222325",
                    letterSpacing: BODY_LETTER_SPACING,
                  }}
                >
                  {monthName} {viewYear}
                </div>
                <div className="flex items-center gap-[2px]">
                  <NavBtn onClick={nextMonth} ariaLabel="Next month">
                    <ChevronSingle dir="right" />
                  </NavBtn>
                  <NavBtn
                    onClick={() => setViewYear((y) => y + 1)}
                    ariaLabel="Next year"
                  >
                    <ChevronDouble dir="right" />
                  </NavBtn>
                </div>
              </div>

              {/* Weekday header */}
              <div className="grid grid-cols-7">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="h-[32px] flex items-center justify-center text-[13px]"
                    style={{ color: "#686f79", fontWeight: 400 }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {cells.map((c, i) => {
                  const isToday = isSameDate(c.date, today);
                  const isSelected = !!selected && isSameDate(c.date, selected);
                  const midnightToday = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                  );
                  const isPast = c.inMonth && c.date < midnightToday;

                  /* Zoom shows today (whether or not it's also the selected value) with the light-blue
                     outlined chip. A different selected day would use the solid-blue pill. */
                  const chipStyle: React.CSSProperties = isToday
                    ? {
                        color: "#0d6bde",
                        background: "#ecf4fd",
                        border: "1px solid #a8ccf8",
                        fontWeight: 600,
                      }
                    : isSelected
                      ? {
                          color: "#ffffff",
                          background: "#0d6bde",
                          border: "1px solid #0d6bde",
                          fontWeight: 600,
                        }
                      : {
                          color: !c.inMonth || isPast ? "#adb1b8" : "#222325",
                          background: "transparent",
                          border: "1px solid transparent",
                          fontWeight: 400,
                        };

                  return (
                    <div
                      key={i}
                      className="h-[36px] flex items-center justify-center"
                    >
                      <button
                        type="button"
                        disabled={!c.inMonth}
                        onClick={() => {
                          if (!c.inMonth) return;
                          onChange(formatMDY(c.date));
                          setOpen(false);
                        }}
                        aria-label={`${c.date.toDateString()}${isSelected ? " selected" : ""}`}
                        className="w-[32px] h-[32px] flex items-center justify-center text-[14px] transition-colors"
                        style={{
                          borderRadius: 999,
                          cursor: c.inMonth ? "pointer" : "default",
                          ...chipStyle,
                        }}
                        onMouseEnter={(e) => {
                          if (!c.inMonth || isSelected || isToday) return;
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#f5f6f7";
                        }}
                        onMouseLeave={(e) => {
                          if (!c.inMonth || isSelected || isToday) return;
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                        }}
                      >
                        {c.date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-[#e5e8ec] my-[16px] -mx-[0px]" />;
}

/* ============================================
   SIDEBAR NAV DATA
   ============================================ */

const sidebarItems = [
  { label: "Home", indent: false, badge: null, external: false },
  {
    label: "My Products",
    indent: false,
    badge: null,
    external: false,
    isCategory: true,
  },
  { label: "AI", indent: true, badge: "New", external: true },
  {
    label: "Meetings",
    indent: true,
    badge: null,
    external: false,
    active: true,
  },
  { label: "Recordings", indent: true, badge: null, external: false },
  { label: "Summaries", indent: true, badge: null, external: false },
  { label: "Hub", indent: true, badge: "New", external: true },
  { label: "Whiteboards", indent: true, badge: null, external: true },
  { label: "Notes", indent: true, badge: null, external: false },
  { label: "Clips", indent: true, badge: null, external: true },
  { label: "Canvas", indent: true, badge: null, external: true },
  { label: "Paper", indent: true, badge: null, external: true },
  { label: "Sheets", indent: true, badge: null, external: true },
  { label: "Slides", indent: true, badge: null, external: true },
  { label: "Tasks", indent: true, badge: null, external: true },
  { label: "Scheduler", indent: true, badge: null, external: true },
  {
    label: "Discover More Products",
    indent: true,
    badge: null,
    external: false,
  },
];

const sidebarCollapsibleItems = [
  { label: "My Account", hasChevron: true },
  { label: "Admin", hasChevron: true },
  { label: "Support", hasChevron: true },
];

/* ============================================
   UTILITY BAR
   ============================================ */

function UtilityBar() {
  return (
    <div
      className="w-full h-[40px] flex items-center justify-end gap-0 px-6 shrink-0"
      style={{ background: "#00031f" }}
    >
      <button
        type="button"
        className="flex items-center gap-1.5 text-[12px] font-[600] text-white/80 hover:text-white px-3 h-full transition-colors"
      >
        <IconSearch />
        <span>Search</span>
      </button>
      <div className="w-px h-4 bg-white/20 mx-1" />
      <a
        href="#"
        className="text-[12px] font-[600] text-white/80 hover:text-white px-3 h-full flex items-center transition-colors"
      >
        Support
      </a>
      <div className="w-px h-4 bg-white/20 mx-1" />
      <a
        href="#"
        className="text-[12px] font-[600] text-white/80 hover:text-white px-3 h-full flex items-center transition-colors"
      >
        1.888.799.9666
      </a>
      <div className="w-px h-4 bg-white/20 mx-1" />
      <a
        href="#"
        className="text-[12px] font-[600] text-white/80 hover:text-white px-3 h-full flex items-center transition-colors"
      >
        Contact Sales
      </a>
      <div className="w-px h-4 bg-white/20 mx-1" />
      <a
        href="#"
        className="text-[12px] font-[600] text-white/80 hover:text-white px-3 h-full flex items-center transition-colors"
      >
        Request a Demo
      </a>
    </div>
  );
}

/* ============================================
   MAIN NAVBAR
   ============================================ */

function MainNavbar() {
  return (
    <div
      className="w-full h-[65px] flex items-center px-6 shrink-0 border-b border-[#e5e8ec]"
      style={{ background: "#ffffff" }}
    >
      {/* Logo */}
      <a href="#" className="shrink-0 mr-8">
        <Image
          src="/clone-schedule/icons/logo-navbar.svg"
          alt="Zoom"
          width={72}
          height={24}
          className="h-[24px] w-auto"
        />
      </a>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        {["Products", "Solutions", "Resources", "Plans & Pricing"].map(
          (item) => (
            <a
              key={item}
              href="#"
              className="px-3 py-1 text-[16px] font-[500] text-[#666484] hover:text-[#232333] transition-colors"
              style={{ fontFamily: FONT_STACK }}
            >
              {item}
            </a>
          ),
        )}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="#"
          className="px-3 py-1 text-[16px] font-[600] text-[#232333] hover:text-[#0d6bde] transition-colors"
          style={{ fontFamily: FONT_STACK }}
        >
          Schedule
        </a>
        <a
          href="#"
          className="px-3 py-1 text-[16px] font-[500] text-[#666484] hover:text-[#232333] transition-colors"
          style={{ fontFamily: FONT_STACK }}
        >
          Join
        </a>
        <a
          href="#"
          className="flex items-center gap-0.5 px-3 py-1 text-[16px] font-[500] text-[#666484] hover:text-[#232333] transition-colors"
          style={{ fontFamily: FONT_STACK }}
        >
          Host <IconChevronDown className="ml-0.5" />
        </a>
        <a
          href="#"
          className="flex items-center gap-0.5 px-3 py-1 text-[16px] font-[500] text-[#666484] hover:text-[#232333] transition-colors"
          style={{ fontFamily: FONT_STACK }}
        >
          Web App <IconChevronDown className="ml-0.5" />
        </a>

        {/* Avatar */}
        <div className="ml-2 h-9 w-9 rounded-full overflow-hidden bg-[#c1c6ce] flex items-center justify-center shrink-0">
          <span className="text-[13px] font-semibold text-white">AA</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   PROMO BANNER
   ============================================ */

function PromoBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex items-center px-6 py-3 text-[14px] text-[#222325] border-b border-[#e5e8ec] overflow-hidden"
      style={{ background: "#ffffff", fontFamily: FONT_STACK }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="shrink-0"
        >
          <circle cx="10" cy="10" r="9" fill="#22c55e" />
          <path
            d="M6 10l3 3 5.5-5.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          <strong>Game on. Save on!</strong> Get champion-level features like
          longer meetings, unlimited AI note-taking with My Notes, 10GB of Cloud
          Storage, and more for 15% off when you purchase a Zoom Workplace Pro
          annual plan. Terms apply.{" "}
          <a href="#" className="text-[#0d6bde] hover:underline">
            Redeem offer
          </a>
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-4 shrink-0 text-[#555b62] hover:text-[#232333] transition-colors"
        aria-label="Dismiss"
      >
        <IconClose />
      </button>
    </motion.div>
  );
}

/* ============================================
   SIDEBAR NAV
   ============================================ */

function Sidebar() {
  return (
    <aside
      className="hidden md:block md:w-[220px] lg:w-[300px] shrink-0 overflow-y-auto py-4"
      style={{
        borderRight: "1px solid #e5e8ec",
        fontFamily: FONT_STACK,
      }}
    >
      <div className="px-3">
        {sidebarItems.map((item) => {
          if (item.isCategory) {
            return (
              <div key={item.label} className="px-2 pt-4 pb-1">
                <span className="text-[12px] font-[400] text-[#686f79]">
                  {item.label}
                </span>
              </div>
            );
          }
          return (
            <div
              key={item.label}
              className={`flex items-center justify-between h-[32px] px-[8px] rounded-[12px] mb-[4px] cursor-pointer transition-colors ${
                item.active
                  ? "bg-[#e3edff] text-[#0d6bde]"
                  : "text-[#232333] hover:bg-[#f0f0f5]"
              } ${item.indent ? "ml-2" : ""}`}
            >
              <span
                className={`text-[14px] ${item.active ? "text-[#0d6bde] font-[500]" : "text-[#232333] font-[400]"}`}
              >
                {item.label}
              </span>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="text-[10px] font-[500] px-1.5 py-0.5 rounded-full border text-[#0d6bde] border-[#0d6bde]/30 bg-[#e8f0fe]">
                    {item.badge}
                  </span>
                )}
                {item.external && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M7 1h4v4M5 7l6-6M3 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V9"
                      stroke="#686f79"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}

        {/* Collapsible items */}
        <div className="mt-2">
          {sidebarCollapsibleItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center h-[32px] px-[8px] rounded-[12px] mb-[4px] cursor-pointer text-[#232333] hover:bg-[#f0f0f5] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="mr-1.5 shrink-0"
              >
                <path
                  d="M5 3l4 4-4 4"
                  stroke="#555b62"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[14px] font-[400]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Upgrade button */}
        <div className="mt-6 px-2 pb-4 sticky bottom-0 bg-white">
          <button
            type="button"
            className="flex items-center text-nowrap gap-1.5 px-[14px] py-[6px] h-[32px] rounded-[24px] text-[14px] font-[500] text-[#0b5cff] transition-colors hover:bg-[#f0f0f5]"
            style={{ border: "1px solid #00f0ea" }}
          >
            <IconStar />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ============================================
   MAIN SCHEDULE FORM PAGE
   ============================================ */

export default function SchedulePageClone() {
  const router = useRouter();

  /* UI state */
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [meetingIDType, setMeetingIDType] = useState<MeetingIDType>("auto");
  const [encryptionType, setEncryptionType] =
    useState<EncryptionType>("enhanced");
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [autoStartZoomAI, setAutoStartZoomAI] = useState(false);
  const [autoMeetingQuestions, setAutoMeetingQuestions] = useState(false);
  const [autoMeetingSummary, setAutoMeetingSummary] = useState(false);
  const [myNotesEnabled, setMyNotesEnabled] = useState(true);
  const [meetingChatEnabled, setMeetingChatEnabled] = useState(true);
  const [hostVideo, setHostVideo] = useState<VideoSetting>("off");
  const [participantVideo, setParticipantVideo] = useState<VideoSetting>("off");

  /* Options panel checkboxes */
  const [joinAnytime, setJoinAnytime] = useState(false);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const [approveBlock, setApproveBlock] = useState(false);

  /* Form field values */
  const [topic, setTopic] = useState("My Meeting");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState("07/07/2026");
  const [timeValue, setTimeValue] = useState("10:30");
  const [ampm, setAmpm] = useState("PM");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("40");
  const [timezone, setTimezone] = useState("(GMT+5:30) India");
  const [passcode, setPasscode] = useState("Xg8j7W");
  const [templateValue, setTemplateValue] = useState("");

  /* Submission */
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      // Parse date & time for API submission
      const [month, day, year] = dateValue.split("/");
      let hours = parseInt(timeValue.split(":")[0], 10);
      const minutes = parseInt(timeValue.split(":")[1] || "0", 10);
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      const dt = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hours,
        minutes,
      );
      const totalMinutes =
        parseInt(durationHours) * 60 + parseInt(durationMinutes);
      await api.schedule({
        title: topic.trim() || "My Meeting",
        description: description.trim(),
        passcode: passcodeEnabled ? passcode.trim() || null : null,
        scheduled_start: dt.toISOString(),
        duration_minutes: totalMinutes || 40,
      });
      router.push("/wc/home");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  /* ============================================
     RENDER
     ============================================ */
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#39394d",
        fontFamily: FONT_STACK,
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "20px",
        letterSpacing: BODY_LETTER_SPACING,
        color: "#232333",
      }}
    >
      {/* ============================================
          UTILITY BAR
          ============================================ */}
      <UtilityBar />

      {/* ============================================
          MAIN NAVBAR
          ============================================ */}
      <MainNavbar />

      {/* ============================================
          PROMO BANNER (dismissible)
          ============================================ */}
      <AnimatePresence>
        {showPromoBanner && (
          <PromoBanner onDismiss={() => setShowPromoBanner(false)} />
        )}
      </AnimatePresence>

      {/* ============================================
          CONTENT AREA: sidebar + main
          ============================================ */}
      <div className="flex flex-1" style={{ background: "#ffffff" }}>
        {/* ============================================
            SIDEBAR
            ============================================ */}
        <Sidebar />

        {/* ============================================
            MAIN CONTENT
            ============================================ */}
        <main className="flex-1 overflow-auto px-[16px] md:px-[32px] py-[32px] min-w-0">
          {/* Back link */}
          <Link
            href="/wc/home"
            className="inline-flex items-center gap-1 text-[14px] font-[400] text-[#0d6bde] hover:underline mb-5"
          >
            <IconArrowLeft />
            Back to Meetings
          </Link>

          {/* Page title */}
          <h1
            className="text-[20px] font-[600] text-[#222325] mb-[32px]"
            style={{
              lineHeight: "22px",
              letterSpacing: "0.42px",
              marginTop: 20,
            }}
          >
            Schedule Meeting
          </h1>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-[12px] border border-[#f5a0a0] bg-[#fff1f1] px-[16px] py-[12px] text-[14px] text-[#c0392b]">
              {error}
            </div>
          )}

          {/* ============================================
              FORM
              ============================================ */}
          <div className="w-full max-w-[1100px]">
            {/* ---- Topic ---- */}
            <FormRow label="Topic" required>
              <ZoomInput
                value={topic}
                onChange={setTopic}
                autoFocus
                className="max-w-[490px]"
              />
              {/* Add Description */}
              {!showDescription ? (
                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="mt-[10px] flex items-center gap-1 text-[14px] text-[#0d6bde] hover:underline bg-transparent border-0 p-0"
                >
                  <span className="text-[16px] leading-none font-light">+</span>
                  <span>Add Description</span>
                </button>
              ) : (
                <div className="mt-[10px]">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a meeting description"
                    rows={3}
                    className="w-full max-w-[490px] rounded-[12px] border border-[#c1c6ce] px-[11px] py-[6px] text-[14px] text-[#222325] outline-none focus:border-[#4b96f1] resize-none"
                    style={{
                      fontFamily: FONT_STACK,
                    }}
                  />
                </div>
              )}
            </FormRow>

            {/* ---- When ---- */}
            <FormRow label="When">
              <div className="flex items-center gap-[8px] flex-wrap">
                {/* Date picker (custom animated calendar) */}
                <ZoomCalendar
                  value={dateValue}
                  onChange={setDateValue}
                  width={240}
                />
                {/* Time select */}
                <ZoomSelect
                  value={timeValue}
                  onChange={setTimeValue}
                  width={230}
                >
                  {[
                    "8:00",
                    "8:30",
                    "9:00",
                    "9:30",
                    "10:00",
                    "10:30",
                    "11:00",
                    "11:30",
                    "12:00",
                    "12:30",
                    "13:00",
                    "13:30",
                    "14:00",
                    "14:30",
                    "15:00",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </ZoomSelect>
                {/* AM/PM select */}
                <ZoomSelect value={ampm} onChange={setAmpm} width={104}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </ZoomSelect>
              </div>
            </FormRow>

            {/* ---- Duration ---- */}
            <FormRow label="Duration">
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-[8px] flex-wrap">
                  <ZoomSelect
                    value={durationHours}
                    onChange={setDurationHours}
                    width={150}
                    disabled
                  >
                    {[
                      "0",
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      "10",
                      "11",
                      "12",
                      "13",
                      "14",
                      "15",
                      "16",
                      "17",
                      "18",
                      "19",
                      "20",
                      "21",
                      "22",
                      "23",
                    ].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </ZoomSelect>
                  <span className="text-[14px] text-[#232333]">hr</span>
                  <ZoomSelect
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                    width={150}
                  >
                    {["0", "15", "30", "40", "45"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </ZoomSelect>
                  <span className="text-[14px] text-[#232333]">min</span>
                </div>

                {/* Free plan warning */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-[12px] rounded-[12px] px-[16px] py-[16px] max-w-[700px]"
                  style={{
                    background: "#fff9f2",
                    border: "1px solid #e1bd93",
                    transition: "opacity 0.3s",
                  }}
                >
                  <IconWarning />
                  <div>
                    <span className="text-[14px] text-[#222325]">
                      You can schedule meetings for up to 40 minutes each with
                      your current Basic plan. Need more time?
                    </span>{" "}
                    <a
                      href="#"
                      className="text-[14px] text-[#0d6bde] hover:underline"
                    >
                      Upgrade to Zoom Workplace Pro
                    </a>
                  </div>
                </motion.div>
              </div>
            </FormRow>

            {/* ---- Time Zone ---- */}
            <FormRow label="Time Zone">
              <div className="flex flex-col gap-[10px]">
                <ZoomSelect value={timezone} onChange={setTimezone} width={320}>
                  {[
                    "(GMT-12:00) International Date Line West",
                    "(GMT-8:00) Pacific Time",
                    "(GMT-5:00) Eastern Time",
                    "(GMT+0:00) UTC",
                    "(GMT+1:00) London",
                    "(GMT+5:30) India",
                    "(GMT+8:00) China Standard Time",
                    "(GMT+9:00) Japan Standard Time",
                  ].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </ZoomSelect>
                {/* Recurring meeting checkbox */}
                <label className="flex items-center gap-2 cursor-pointer mt-[4px]">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="w-[16px] h-[16px] mt-[1px] accent-[#0d6bde] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#232333]">
                    Recurring meeting
                  </span>
                </label>
              </div>
            </FormRow>

            {/* ---- Invitees ---- */}
            <FormRow label="Invitees">
              <div className="flex flex-col gap-[10px]">
                <ZoomInput
                  placeholder="Enter user names or email addresses"
                  className="max-w-[460px]"
                />
                {/* Calendar not connected warning */}
                <div
                  className="flex gap-[12px] rounded-[12px] px-[16px] py-[16px] max-w-[700px]"
                  style={{ background: "#fff9f2", border: "1px solid #e1bd93" }}
                >
                  <IconWarning />
                  <div>
                    <span className="text-[14px] text-[#222325]">
                      Participants won&rsquo;t receive this meeting invite until
                      your calendar is connected.
                    </span>{" "}
                    <a
                      href="#"
                      className="text-[14px] text-[#0d6bde] hover:underline"
                    >
                      Connect calendar
                    </a>
                  </div>
                </div>
              </div>
            </FormRow>

            <SectionDivider />

            {/* ---- Meeting ID ---- */}
            <FormRow label="Meeting ID">
              <div className="flex items-center gap-[32px] flex-wrap">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="meetingId"
                    checked={meetingIDType === "auto"}
                    onChange={() => setMeetingIDType("auto")}
                    className="w-[16px] h-[16px] accent-[#0d6bde]"
                  />
                  <span className="text-[14px] text-[#232333]">
                    Generate Automatically
                  </span>
                </label>
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="meetingId"
                    checked={meetingIDType === "personal"}
                    onChange={() => setMeetingIDType("personal")}
                    className="w-[16px] h-[16px] accent-[#0d6bde]"
                  />
                  <span className="text-[14px] text-[#232333]">
                    Personal Meeting ID 456 219 4387
                  </span>
                </label>
              </div>
            </FormRow>

            {/* ---- Template ---- */}
            <FormRow label="Template">
              <ZoomSelect
                value={templateValue}
                onChange={setTemplateValue}
                width={240}
              >
                <option value="">Select a template</option>
                <option value="general">General Meeting</option>
                <option value="standup">Daily Standup</option>
                <option value="webinar">Webinar</option>
              </ZoomSelect>
            </FormRow>

            {/* ---- Whiteboard ---- */}
            <FormRow label="Whiteboard" labelIcon={<IconInfo />}>
              <button
                type="button"
                className="flex items-center h-[32px] px-[12px] rounded-[12px] text-[14px] text-[#0d6bde] border border-[#c1c6ce] bg-white hover:bg-[#f0f4ff] transition-colors gap-1"
              >
                <IconWhiteboard />
                Add Whiteboard
              </button>
            </FormRow>

            {/* ---- Docs ---- */}
            <FormRow label="Docs">
              <button
                type="button"
                className="flex items-center h-[32px] px-[12px] rounded-[12px] text-[14px] text-[#0d6bde] border border-[#c1c6ce] bg-white hover:bg-[#f0f4ff] transition-colors gap-1"
              >
                <IconDoc />
                Add Docs
              </button>
            </FormRow>

            <SectionDivider />

            {/* ---- Security ---- */}
            <FormRow label="Security" alignTop>
              <div className="flex flex-col gap-[10px]">
                {/* Passcode */}
                <div>
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passcodeEnabled}
                      onChange={(e) => setPasscodeEnabled(e.target.checked)}
                      className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                    />
                    <span className="text-[14px] text-[#232333]">Passcode</span>
                    {passcodeEnabled && (
                      <input
                        type="text"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="ml-1 h-[32px] w-[120px] rounded-none border border-[#c1c6ce] px-[8px] text-[14px] text-[#222325] outline-none focus:border-[#4b96f1]"
                        style={{
                          fontFamily: FONT_STACK,
                        }}
                      />
                    )}
                  </label>
                  {passcodeEnabled && (
                    <p className="mt-[4px] ml-[24px] text-[12px] text-[#686f79]">
                      Only users who have the invite link or passcode can join
                      the meeting
                    </p>
                  )}
                </div>
                {/* Waiting Room */}
                <div>
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waitingRoomEnabled}
                      onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                      className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                    />
                    <span className="text-[14px] font-[500] text-[#232333]">
                      Waiting Room
                    </span>
                  </label>
                  <p className="mt-[4px] ml-[24px] text-[12px] text-[#686f79]">
                    Only users admitted by the host can join the meeting
                  </p>
                </div>
              </div>
            </FormRow>

            <SectionDivider />

            {/* ---- Encryption ---- */}
            <FormRow label="Encryption">
              <div className="flex items-center gap-[32px] flex-wrap">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="encryption"
                    checked={encryptionType === "enhanced"}
                    onChange={() => setEncryptionType("enhanced")}
                    className="w-[16px] h-[16px] accent-[#0d6bde]"
                  />
                  <IconShield />
                  <span className="text-[14px] text-[#232333]">
                    Enhanced encryption
                  </span>
                  <IconInfo />
                </label>
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="encryption"
                    checked={encryptionType === "e2e"}
                    onChange={() => setEncryptionType("e2e")}
                    className="w-[16px] h-[16px] accent-[#0d6bde]"
                  />
                  <IconShield />
                  <span className="text-[14px] text-[#232333]">
                    End-to-end encryption
                  </span>
                  <IconInfo />
                </label>
              </div>
            </FormRow>

            <SectionDivider />

            {/* ---- Zoom AI ---- */}
            <FormRow label="Zoom AI" alignTop>
              <div className="flex flex-col gap-[8px]">
                <p
                  className="text-[14px] font-[590] text-[#232333] leading-[24px] pb-[4px]"
                  style={{ fontWeight: 600 }}
                >
                  Zoom AI
                </p>

                {/* Auto start Zoom AI */}
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStartZoomAI}
                    onChange={(e) => setAutoStartZoomAI(e.target.checked)}
                    className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#232333]">
                    Automatically start Zoom AI
                  </span>
                  <IconInfo />
                </label>

                {/* Sub-items (indented) */}
                <div className="ml-[24px] flex flex-col gap-[8px]">
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoMeetingQuestions}
                      onChange={(e) =>
                        setAutoMeetingQuestions(e.target.checked)
                      }
                      className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                    />
                    <span className="text-[14px] text-[#232333]">
                      Automatically start meeting questions
                    </span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoMeetingSummary}
                      onChange={(e) => setAutoMeetingSummary(e.target.checked)}
                      className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                    />
                    <span className="text-[14px] text-[#232333]">
                      Automatically start meeting summary
                    </span>
                  </label>
                </div>

                {/* Meeting summary template */}
                <div className="mt-[12px]">
                  {/* TODO (QA review-notes.md Minor #1): "NEW" tooltip bubble per section-options.png */}
                  <div className="relative inline-flex items-center gap-2 mb-[8px]">
                    <p className="text-[14px] font-[600] text-[#232333]">
                      Meeting summary template
                    </p>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white border border-[#e5e8ec] rounded-[12px] shadow-lg p-3 w-[230px] text-[13px] text-[#232333] z-10 pointer-events-none">
                      <span className="inline-block bg-[#e3f5e1] text-[#16a34a] text-[10px] font-[600] px-1.5 py-0.5 rounded-full mr-1 align-middle">
                        NEW
                      </span>
                      <strong className="align-middle">
                        Meeting summary template
                      </strong>
                      <p className="mt-1 text-[12px] text-[#686f79] leading-[1.4]">
                        You can now select a summary template based on different
                        meeting types.
                      </p>
                    </div>
                  </div>
                  <ZoomSelect value="general" width={380}>
                    <option value="general">General template</option>
                    <option value="standup">Standup template</option>
                    <option value="project">Project review template</option>
                  </ZoomSelect>
                  <div className="mt-[6px]">
                    <a
                      href="#"
                      className="text-[14px] text-[#0d6bde] hover:underline flex items-center gap-0.5"
                    >
                      Change default summary template
                      <IconExternalLink />
                    </a>
                  </div>
                </div>
              </div>
            </FormRow>

            <SectionDivider />

            {/* ---- My Notes ---- */}
            <FormRow label="My notes">
              <label className="flex items-center gap-[8px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={myNotesEnabled}
                  onChange={(e) => setMyNotesEnabled(e.target.checked)}
                  className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                />
                <span className="text-[14px] text-[#232333]">
                  Allow everyone to use meeting transcript with My notes
                </span>
              </label>
            </FormRow>

            {/* ---- Meeting Chat ---- */}
            <FormRow label="Meeting chat">
              <label className="flex items-center gap-[8px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={meetingChatEnabled}
                  onChange={(e) => setMeetingChatEnabled(e.target.checked)}
                  className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                />
                <span className="text-[14px] text-[#232333]">
                  Allow users to access meeting chats before and after the
                  meeting
                </span>
              </label>
            </FormRow>

            <SectionDivider />

            {/* ---- Video ---- */}
            <FormRow label="Video" alignTop>
              <div className="flex flex-col gap-[8px]">
                {/* Host */}
                <div className="flex items-center gap-[32px]">
                  <span className="text-[14px] text-[#232333] w-[100px]">
                    Host
                  </span>
                  <div className="flex items-center gap-[20px]">
                    <label className="flex items-center gap-[6px] cursor-pointer">
                      <input
                        type="radio"
                        name="hostVideo"
                        checked={hostVideo === "on"}
                        onChange={() => setHostVideo("on")}
                        className="w-[16px] h-[16px] accent-[#0d6bde]"
                      />
                      <span className="text-[14px] text-[#232333]">on</span>
                    </label>
                    <label className="flex items-center gap-[6px] cursor-pointer">
                      <input
                        type="radio"
                        name="hostVideo"
                        checked={hostVideo === "off"}
                        onChange={() => setHostVideo("off")}
                        className="w-[16px] h-[16px] accent-[#0d6bde]"
                      />
                      <span className="text-[14px] text-[#232333]">off</span>
                    </label>
                  </div>
                </div>
                {/* Participant */}
                <div className="flex items-center gap-[32px]">
                  <span className="text-[14px] text-[#232333] w-[100px]">
                    Participant
                  </span>
                  <div className="flex items-center gap-[20px]">
                    <label className="flex items-center gap-[6px] cursor-pointer">
                      <input
                        type="radio"
                        name="participantVideo"
                        checked={participantVideo === "on"}
                        onChange={() => setParticipantVideo("on")}
                        className="w-[16px] h-[16px] accent-[#0d6bde]"
                      />
                      <span className="text-[14px] text-[#232333]">on</span>
                    </label>
                    <label className="flex items-center gap-[6px] cursor-pointer">
                      <input
                        type="radio"
                        name="participantVideo"
                        checked={participantVideo === "off"}
                        onChange={() => setParticipantVideo("off")}
                        className="w-[16px] h-[16px] accent-[#0d6bde]"
                      />
                      <span className="text-[14px] text-[#232333]">off</span>
                    </label>
                  </div>
                </div>
              </div>
            </FormRow>

            <SectionDivider />

            {/* ---- Options (Show/Hide) ---- */}
            <FormRow label="Options">
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptions((v) => !v)}
                  className="text-[14px] text-[#0d6bde] hover:underline bg-transparent border-0 p-0 mb-[12px]"
                >
                  {showOptions ? "Hide" : "Show"}
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      key="options-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-[10px]">
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={joinAnytime}
                            onChange={(e) => setJoinAnytime(e.target.checked)}
                            className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                          />
                          <span className="text-[14px] text-[#232333]">
                            Allow participants to join anytime
                          </span>
                        </label>
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={muteOnEntry}
                            onChange={(e) => setMuteOnEntry(e.target.checked)}
                            className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                          />
                          <span className="text-[14px] text-[#232333]">
                            Mute participants upon entry
                          </span>
                        </label>
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoRecord}
                            onChange={(e) => setAutoRecord(e.target.checked)}
                            className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                          />
                          <span className="text-[14px] text-[#232333]">
                            Automatically record meeting on the local computer
                          </span>
                        </label>
                        <label className="flex items-center gap-[8px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={approveBlock}
                            onChange={(e) => setApproveBlock(e.target.checked)}
                            className="w-[16px] h-[16px] accent-[#0d6bde] cursor-pointer"
                          />
                          <span className="text-[14px] text-[#232333]">
                            Approve or block entry to users from specific
                            regions/countries
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FormRow>

            {/* ============================================
                SAVE / CANCEL FOOTER BUTTONS
                ============================================ */}
            <div className="flex items-center gap-[8px] mt-[8px] mb-[40px]">
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={busy}
                whileHover={{ filter: "brightness(0.92)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="h-[32px] px-[14px] rounded-[12px] text-[14px] font-[500] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#0d6bde", border: "none" }}
              >
                {busy ? "Saving…" : "Save"}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push("/wc/home")}
                whileHover={{ filter: "brightness(0.95)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="h-[32px] px-[14px] rounded-[12px] text-[14px] font-[400] text-[#0d6bde]"
                style={{ background: "#f1f4f6", border: "none", marginLeft: 8 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer
        className="w-full"
        style={{
          background: "#39394d",
          fontFamily: FONT_STACK,
        }}
      >
        {/* Main footer columns */}
        <div className="max-w-[1200px] mx-auto px-[32px] py-[40px] grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <h4 className="text-[14px] font-[600] text-white mb-[16px]">
              About
            </h4>
            <ul className="flex flex-col gap-[8px]">
              {[
                "Zoom Blog",
                "Customers",
                "Our Team",
                "Careers",
                "Integrations",
                "Partners",
                "Investors",
                "Press",
                "Sustainability & ESG",
                "Zoom Cares",
                "Media Kit",
                "How to Videos",
                "Developer Platform",
                "Zoom Ventures",
                "Zoom Merchandise Store",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Download */}
          <div>
            <h4 className="text-[14px] font-[600] text-white mb-[16px]">
              Download
            </h4>
            <ul className="flex flex-col gap-[8px]">
              {[
                "Zoom Workplace App",
                "Browser Extension",
                "iPhone/iPad App",
                "Android App",
                "Zoom Virtual Backgrounds",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Sales */}
          <div>
            <h4 className="text-[14px] font-[600] text-white mb-[16px]">
              Sales
            </h4>
            <ul className="flex flex-col gap-[8px]">
              {[
                "1.888.799.9666",
                "Contact Sales",
                "Plans & Pricing",
                "Request a Demo",
                "Webinars and Events",
                "Zoom Experience Center",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="text-[14px] font-[600] text-white mb-[16px]">
              Support
            </h4>
            <ul className="flex flex-col gap-[8px]">
              {[
                "Test Zoom",
                "Account",
                "Support Center",
                "Learning Center",
                "Zoom Community",
                "Feedback",
                "Contact Us",
                "Accessibility",
                "Developer support",
                "Privacy, Security, Legal Policies, and Modern Slavery Act",
                "Transparency Statement",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Language / Currency / Social */}
          <div>
            <h4 className="text-[14px] font-[600] text-white mb-[16px]">
              Language
            </h4>
            <div className="mb-[20px]">
              <select className="h-[32px] rounded-[8px] border border-white/30 bg-transparent text-[13px] text-white px-[10px] outline-none">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <h4 className="text-[14px] font-[600] text-white mb-[12px]">
              Currency
            </h4>
            <div className="mb-[20px]">
              <select className="h-[32px] rounded-[8px] border border-white/30 bg-transparent text-[13px] text-white px-[10px] outline-none">
                <option>Indian Rupee ₹</option>
                <option>US Dollar $</option>
                <option>Euro €</option>
              </select>
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-[8px] flex-nowrap">
              {/* WordPress */}
              <a
                href="#"
                className="w-[32px] h-[32px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.27 14.58L7.4 9.07c.47-.02.9-.08 1.29-.2.04-.01.07-.01.11-.02-.01.03-.02.07-.02.1 0 .4.29.73.67.8L12 14.5l2.55-7.58c.09-.28.37-.47.67-.47.12 0 .24.04.35.1l.04.03L17 9.07l-3.33 7.51c-.08.18-.25.29-.44.29-.19 0-.36-.11-.44-.29l-1.4-3.15-1.34 3.15c-.08.18-.25.29-.44.29-.2 0-.37-.11-.44-.29zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                className="w-[32px] h-[32px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Twitter/X */}
              <a
                href="#"
                className="w-[32px] h-[32px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.258 5.626 5.906-5.626zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="#"
                className="w-[32px] h-[32px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="w-[32px] h-[32px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="w-[32px] h-[32px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className="border-t border-white/10 px-[32px] py-[16px] flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] text-white/60">
          <span>
            Copyright ©2026 Zoom Communications, Inc. All rights reserved.
          </span>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Trust Center
          </a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Acceptable Use Guidelines
          </a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Legal &amp; Compliance
          </a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Your Privacy Choices
          </a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Cookie Preferences
          </a>
        </div>
      </footer>
    </div>
  );
}
