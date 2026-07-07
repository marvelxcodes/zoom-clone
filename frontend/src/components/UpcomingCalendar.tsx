import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { Video } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { parseServerDate, formatMeetingId } from "@/lib/utils";
import CopyLinkButton from "./CopyLinkButton";

function UmbrellaIllustration() {
  return (
    <svg width={92} height={92} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="106" rx="28" ry="4" fill="#e5e7f0" />
      <path
        d="M60 22c22 0 38 15 38 38H22c0-23 16-38 38-38z"
        fill="#c9d1e8"
      />
      <path
        d="M60 22v0M40 60c0-15 8-30 20-32M80 60c0-15-8-30-20-32"
        stroke="#a3adcc"
        strokeWidth={1.5}
      />
      <path
        d="M60 22v52c0 8-7 12-13 12"
        stroke="#8f97b8"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx="47" cy="86" r="3.5" fill="#8f97b8" />
      <path
        d="M22 60h76"
        stroke="#a3adcc"
        strokeWidth={1.2}
      />
    </svg>
  );
}

export default function UpcomingCalendar({
  upcoming,
  recent,
}: {
  upcoming: Meeting[];
  recent: Meeting[];
}) {
  const today = new Date();
  const todaysMeetings = [...upcoming, ...recent].filter((m) => {
    const d = parseServerDate(m.scheduled_start || m.started_at);
    return d && isSameDay(d, today);
  });

  const upcomingList = upcoming.slice(0, 6);
  const list = todaysMeetings.length > 0 ? todaysMeetings : upcomingList;

  if (list.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ padding: "48px 16px", gap: 12, minHeight: 300 }}
      >
        <UmbrellaIllustration />
        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            lineHeight: "20px",
            letterSpacing: "0.42px",
            color: "#6e7680",
          }}
        >
          No meetings scheduled.
        </p>
      </div>
    );
  }

  return (
    <ul style={{ borderTop: "1px solid #e5e8ec" }}>
      {list.map((m, idx) => {
        const d = parseServerDate(m.scheduled_start || m.started_at);
        return (
          <li
            key={m.id}
            className="group flex items-center hover:bg-[#f5f6f7]"
            style={{
              padding: "12px 20px",
              gap: 12,
              borderTop: idx === 0 ? "none" : "1px solid #e5e8ec",
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                height: 36,
                width: 36,
                borderRadius: 8,
                background: "rgba(14, 113, 235, 0.1)",
                color: "#0e71eb",
              }}
            >
              <Video size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: "20px",
                  letterSpacing: "0.42px",
                  color: "#232333",
                }}
              >
                {m.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: "16px",
                  color: "#6e7680",
                }}
              >
                {d ? format(d, "h:mm a") : ""} · ID {formatMeetingId(m.meeting_id)}
              </div>
            </div>
            <div
              className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ gap: 6 }}
            >
              <CopyLinkButton url={m.invite_url} label="Copy" />
              {m.status !== "ended" && (
                <Link
                  href={`/wc/${m.meeting_id}/start`}
                  style={{
                    background: "#0e71eb",
                    color: "#ffffff",
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: "18px",
                  }}
                  className="hover:brightness-95"
                >
                  Start
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
