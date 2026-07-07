import { format } from "date-fns";
import { Info, ExternalLink } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import HomeActions from "@/components/HomeActions";
import HomeClock from "@/components/HomeClock";
import UpcomingCalendar from "@/components/UpcomingCalendar";
import ZoomIcon from "@/components/ZoomIcon";
import { api } from "@/lib/api";
import type { Meeting } from "@/lib/types";

async function loadHome() {
  const [upcoming, recent] = await Promise.all([
    api.upcoming().catch(() => [] as Meeting[]),
    api.recent().catch(() => [] as Meeting[]),
  ]);
  return { upcoming, recent };
}

export default async function HomePage() {
  const { upcoming, recent } = await loadHome();
  const now = new Date();

  return (
    <DashboardShell activeNav="Home">
      <div
        className="mx-auto flex flex-col"
        style={{ maxWidth: 632, padding: "48px 16px 64px" }}
      >
        <HomeClock />

        <div style={{ marginTop: 40 }}>
          <HomeActions />
        </div>

        {/* Upcoming card — outer container matches .calendar-widget */}
        <div
          style={{
            marginTop: 40,
            border: "1px solid #ededf4",
            background: "#ffffff",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Calendar-not-connected banner (nested inside card per Zoom's DOM) */}
          <div
            className="flex items-start"
            style={{
              margin: 8,
              border: "1px solid #a8ccf8",
              background: "#f2f8ff",
              borderRadius: 12,
              padding: 16,
              gap: 12,
              fontSize: 14,
              lineHeight: "24px",
              letterSpacing: "0.42px",
              color: "#222325",
            }}
          >
            <Info
              size={18}
              style={{ marginTop: 3, color: "#f2f8ff", flexShrink: 0 }}
            />
            <div className="leading-5 tracking-normal">
              You haven&apos;t connected your calendar yet.{" "}
              <a
                href="#"
                style={{
                  color: "#0d6bde",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
                className="hover:underline"
              >
                Connect now
              </a>{" "}
              to manage all your meetings and events in one place.
            </div>
          </div>

          {/* Today, Jul X header */}
          <div
            className="flex items-center justify-center"
            style={{ padding: "6px 16px 6px 8px", height: 44 }}
          >
            <button
              type="button"
              className="flex items-center hover:bg-[#f5f6f7]"
              style={{
                fontSize: 14,
                fontWeight: 500,
                lineHeight: "26px",
                letterSpacing: "0.42px",
                color: "#131619",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {format(now, "'Today, 'MMM d")}
              <ZoomIcon name="chevron-down" size={12} color="#131619" />
            </button>
            <button
              type="button"
              aria-label="Open calendar"
              className="flex items-center justify-center hover:bg-[#f5f6f7]"
              style={{
                height: 28,
                width: 28,
                borderRadius: 6,
                color: "#6e7680",
              }}
            >
              <ExternalLink size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Today chip + prev/next + more */}
          <div
            className="flex items-center justify-between border-x-transparent border border-[#ededf4]"
            style={{ padding: "6px 16px 8px 16px" }}
          >
            <div className="flex items-center" style={{ gap: 6 }}>
              <button
                type="button"
                className="flex items-center hover:bg-[#f5f6f7]"
                style={{
                  border: "1px solid #98a0a9",
                  borderRadius: 999,
                  padding: "2px 8px",
                  height: 24,
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: "16px",
                  color: "#222325",
                  gap: 4,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path d="M3 9h18M8 2v4M16 2v4" />
                </svg>
                Today
              </button>
              <button
                type="button"
                aria-label="Previous"
                className="flex items-center justify-center hover:bg-[#f5f6f7]"
                style={{
                  height: 24,
                  width: 24,
                  borderRadius: 6,
                  color: "#6e7680",
                }}
              >
                <ZoomIcon name="chevron-left" size={22} />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="flex items-center justify-center hover:bg-[#f5f6f7]"
                style={{
                  height: 24,
                  width: 24,
                  borderRadius: 6,
                  color: "#6e7680",
                }}
              >
                <ZoomIcon name="chevron-right" size={22} />
              </button>
            </div>
            <button
              type="button"
              aria-label="More options"
              className="flex items-center justify-center hover:bg-[#f5f6f7]"
              style={{
                height: 24,
                width: 24,
                borderRadius: 6,
                color: "#6e7680",
              }}
            >
              <ZoomIcon name="nav-more" size={14} />
            </button>
          </div>

          <UpcomingCalendar upcoming={upcoming} recent={recent} />

          {/* Open recordings footer */}
          <div style={{ borderTop: "1px solid #dfe3e8", padding: "12px 16px" }}>
            <button
              type="button"
              className="flex items-center hover:underline"
              style={{
                fontSize: 14,
                fontWeight: 400,
                lineHeight: "16px",
                letterSpacing: "0.42px",
                color: "#444b53",
                gap: 6,
              }}
            >
              Open recordings
              <ZoomIcon name="chevron-right" size={12} color="#444b53" />
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
