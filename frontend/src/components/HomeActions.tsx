"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import ZoomIcon from "./ZoomIcon";

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "14px",
  letterSpacing: "0.42px",
  color: "#6e7680",
};

const BTN_BASE = "zoom-action-btn";

export default function HomeActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function startInstant() {
    if (busy) return;
    try {
      setBusy(true);
      const m = await api.createInstant();
      router.push(`/wc/${m.meeting_id}/start?host=1`);
    } catch (e) {
      alert((e as Error).message || "Failed to start meeting");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <style>{`
        .zoom-action-btn {
          height: 56px;
          width: 56px;
          border-radius: 20px;
          padding: 14px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(0);
          box-shadow: none;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .zoom-action-btn:hover:not(:disabled),
        .zoom-action-btn:focus-visible:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: rgb(179, 179, 179) 0px 4px 11px 0px;
        }
        .zoom-action-btn--orange { background-color: #ff742e; }
        .zoom-action-btn--orange:active:not(:disabled) { background-color: #e56829; }
        .zoom-action-btn--orange:disabled { background-color: #f9cbb7; transform: none; box-shadow: none; cursor: default; }
        .zoom-action-btn--blue { background-color: #0e71eb; }
        .zoom-action-btn--blue:active:not(:disabled) { background-color: #0c63ce; }
        .zoom-action-btn--blue:disabled { background-color: #b1c7f6; transform: none; box-shadow: none; cursor: default; }
      `}</style>
      <div className="flex items-start justify-center gap-8">
        {/* New meeting */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={startInstant}
            disabled={busy}
            aria-label="New meeting"
            className={`${BTN_BASE} zoom-action-btn--orange`}
          >
            <ZoomIcon name="action-new-meeting" size={28} color="#ffffff" />
          </button>
          <div className="flex items-center" style={{ ...LABEL_STYLE, gap: 2 }}>
            {busy ? "Starting…" : "New meeting"}
            <ZoomIcon name="chevron-down" size={13} color="#6e7680" />
          </div>
        </div>

        {/* Join */}
        <div className="flex flex-col items-center" style={{ gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/wc/join")}
            aria-label="Join meeting"
            className={`${BTN_BASE} zoom-action-btn--blue`}
          >
            <ZoomIcon name="action-join" size={28} color="#ffffff" />
          </button>
          <span style={LABEL_STYLE}>Join</span>
        </div>

        {/* Schedule */}
        <div className="flex flex-col items-center ml-6" style={{ gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/meeting/schedule")}
            aria-label="Schedule a meeting"
            className={`${BTN_BASE} zoom-action-btn--blue`}
            style={{ padding: 10 }}
          >
            <img
              src="/icons/action-schedule.svg"
              alt=""
              aria-hidden="true"
              style={{ width: 28, height: 28, display: "block" }}
            />
          </button>
          <span style={LABEL_STYLE}>Schedule</span>
        </div>
      </div>
    </>
  );
}
