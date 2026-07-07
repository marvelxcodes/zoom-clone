import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { Copy, Video } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { formatMeetingId, parseServerDate } from "@/lib/utils";
import CopyLinkButton from "./CopyLinkButton";

function formatWhen(iso?: string | null) {
  const d = parseServerDate(iso);
  if (!d) return "";
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`;
  return format(d, "EEE, MMM d · h:mm a");
}

export default function MeetingList({
  meetings,
  emptyLabel,
  showJoin = true,
}: {
  meetings: Meeting[];
  emptyLabel: string;
  showJoin?: boolean;
}) {
  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zoom-border-subtle bg-white px-4 py-8 text-center text-sm text-zoom-muted">
        {emptyLabel}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {meetings.map((m) => (
        <li
          key={m.id}
          className="flex items-center gap-4 rounded-xl border border-zoom-border-subtle bg-white p-4 hover:border-zoom-blue-light hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zoom-blue/10 text-zoom-blue">
            <Video size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate font-semibold text-zoom-text">
                {m.title}
              </div>
              {m.status === "active" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Live
                </span>
              )}
            </div>
            <div className="text-xs text-zoom-muted mt-0.5">
              {m.scheduled_start ? formatWhen(m.scheduled_start) : ""}
              {m.scheduled_start ? " · " : ""}
              Meeting ID: {formatMeetingId(m.meeting_id)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CopyLinkButton
              url={m.invite_url}
              label="Copy invite"
              icon={<Copy size={14} />}
            />
            {showJoin && (
              <Link
                href={`/wc/${m.meeting_id}/start`}
                className="rounded-[20px] bg-zoom-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-zoom-blue-dark transition-colors"
              >
                Start
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
