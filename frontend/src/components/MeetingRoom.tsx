"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Copy } from "lucide-react";
import { api } from "@/lib/api";
import type { Meeting, Participant } from "@/lib/types";
import { formatMeetingId, initials, parseServerDate } from "@/lib/utils";

/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  meeting: Meeting;
  currentUserName: string;
  preferredName: string;
  isHostShortcut: boolean;
  preferredMuted: boolean;
  preferredVideoOn: boolean;
  passcode: string | null;
};

const AVATAR_COLORS = [
  "#0E71EB",
  "#F5A623",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
  "#F472B6",
  "#22D3EE",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type PanelKind = "participants" | "chat" | null;

/* ============================================================
   MEETING ICON COMPONENT
   Uses mask-image for currentColor icons; <img> for colored SVGs
   ============================================================ */

type MeetingIconName =
  | "mic"
  | "mic-off"
  | "video"
  | "video-off"
  | "participants"
  | "chat"
  | "reactions"
  | "share-screen"
  | "host-tools"
  | "more"
  | "end"
  | "security-shield"
  | "view"
  | "zoom-ai"
  | "chevron-up"
  | "hand-raise";

/** Use this for icons that should inherit color (mask-based). */
function MIcon({
  name,
  size = 24,
  color = "currentColor",
  className,
}: {
  name: MeetingIconName;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: color,
        WebkitMaskImage: `url(/icons/meeting/${name}.svg)`,
        maskImage: `url(/icons/meeting/${name}.svg)`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

/** Use this for icons that have their own embedded colors (displayed as-is). */
function MImg({
  name,
  size = 24,
  className,
}: {
  name: MeetingIconName;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/meeting/${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    />
  );
}

/* ============================================================
   TOOLBAR BUTTON COMPONENT
   ============================================================ */

function ToolbarBtn({
  children,
  label,
  onClick,
  active,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={[
        "flex flex-col items-center justify-center gap-0 rounded-[8px] px-[8px] py-0",
        "min-w-[80px] max-w-[160px] h-[48px] mt-[2px]",
        "text-[12px] font-[400] leading-[16px] text-white",
        "transition-colors duration-150",
        active
          ? "bg-[rgba(255,255,255,0.18)]"
          : "bg-transparent hover:bg-[rgba(255,255,255,0.09)]",
        className ?? "",
      ].join(" ")}
    >
      <span className="flex items-center justify-center h-[24px] mb-[3px]">
        {children}
      </span>
      {label && (
        <span
          className="max-w-[120px] truncate mx-[12px] text-[12px] leading-[16px] font-[400]"
          style={{ color: "rgba(255,255,255,1)" }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

/** Small chevron toggle for sub-menu trigger */
function ChevronBtn({
  onClick,
  ariaLabel,
}: {
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="absolute top-[2px] right-[2px] w-[20px] h-[26px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(255,255,255,0.09)] transition-colors"
    >
      <MIcon name="chevron-up" size={16} color="rgba(255,255,255,0.5)" />
    </button>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function MeetingRoom(props: Props) {
  const {
    meeting,
    currentUserName,
    preferredName,
    preferredMuted,
    preferredVideoOn,
    passcode,
  } = props;

  const router = useRouter();
  const meetingIdStr = meeting.meeting_id;
  const storageKey = `zc:participant:${meetingIdStr}`;

  const [participantId, setParticipantId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [needsName, setNeedsName] = useState(!preferredName);
  const [nameInput, setNameInput] = useState(
    preferredName || currentUserName || "",
  );
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelKind>(null);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showHostTools, setShowHostTools] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [flyingReaction, setFlyingReaction] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"speaker" | "gallery">("speaker");
  const [handRaised, setHandRaised] = useState(false);
  const [ended, setEnded] = useState(meeting.status === "ended");
  const [barsVisible, setBarsVisible] = useState(true);
  const joinedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = participants.find((p) => p.id === participantId) || null;
  const isHost = me?.is_host ?? false;

  /* ------ auto-hide bars on mouse idle ------ */
  const showBars = useCallback(() => {
    setBarsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      // only hide if no popover is open
      setBarsVisible(false);
    }, 3500);
  }, []);

  useEffect(() => {
    showBars();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep bars visible when any popover is open */
  useEffect(() => {
    if (showInfo || showReactions || showViewMenu || showMoreMenu || showHostTools || showEndConfirm) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setBarsVisible(true);
    }
  }, [showInfo, showReactions, showViewMenu, showMoreMenu, showHostTools, showEndConfirm]);

  /* ---- join logic ---- */
  const doJoin = useCallback(
    async (name: string) => {
      if (joinedRef.current) return;
      joinedRef.current = true;
      try {
        setError(null);
        const existing =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(storageKey)
            : null;
        if (existing) {
          const id = Number(existing);
          const list = await api
            .participants(meetingIdStr)
            .catch(() => [] as Participant[]);
          if (list.some((p) => p.id === id)) {
            setParticipantId(id);
            setParticipants(list);
            setNeedsName(false);
            return;
          }
        }
        const p = await api.join(meetingIdStr, {
          display_name: name,
          passcode: passcode ?? undefined,
          muted: preferredMuted,
          video_on: preferredVideoOn,
        });
        setParticipantId(p.id);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, String(p.id));
        }
        setNeedsName(false);
      } catch (err) {
        joinedRef.current = false;
        setError((err as Error).message);
        setNeedsName(true);
      }
    },
    [meetingIdStr, passcode, preferredMuted, preferredVideoOn, storageKey],
  );

  useEffect(() => {
    if (preferredName && !joinedRef.current) {
      doJoin(preferredName);
    }
  }, [preferredName, doJoin]);

  /* ---- poll participants ---- */
  useEffect(() => {
    if (needsName) return;
    let cancelled = false;
    async function tick() {
      try {
        const list = await api.participants(meetingIdStr);
        if (!cancelled) setParticipants(list);
        if (
          participantId != null &&
          !list.some((p) => p.id === participantId)
        ) {
          setEnded(true);
        }
      } catch {
        // network hiccup
      }
    }
    tick();
    const t = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [meetingIdStr, needsName, participantId]);

  /* ---- controls ---- */
  const toggleMuted = useCallback(async () => {
    if (!me || !participantId) return;
    try {
      const next = await api.updateParticipant(meetingIdStr, participantId, {
        is_muted: !me.is_muted,
      });
      setParticipants((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    } catch {}
  }, [me, participantId, meetingIdStr]);

  const toggleVideo = useCallback(async () => {
    if (!me || !participantId) return;
    try {
      const next = await api.updateParticipant(meetingIdStr, participantId, {
        is_video_on: !me.is_video_on,
      });
      setParticipants((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    } catch {}
  }, [me, participantId, meetingIdStr]);

  const toggleHand = useCallback(async () => {
    if (!me || !participantId) return;
    try {
      const next = await api.updateParticipant(meetingIdStr, participantId, {
        is_hand_raised: !me.is_hand_raised,
      });
      setParticipants((prev) => prev.map((p) => (p.id === next.id ? next : p)));
      setHandRaised(next.is_hand_raised);
    } catch {}
  }, [me, participantId, meetingIdStr]);

  const leaveMeeting = useCallback(async () => {
    if (participantId) {
      await api.leave(meetingIdStr, participantId).catch(() => {});
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }
    router.push("/wc/home");
  }, [participantId, meetingIdStr, router, storageKey]);

  const endMeetingForAll = useCallback(async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/meetings/${meetingIdStr}/end`,
        { method: "POST" },
      );
    } catch {}
    setShowEndConfirm(false);
    leaveMeeting();
  }, [meetingIdStr, leaveMeeting]);

  const sendReaction = useCallback((emoji: string) => {
    setFlyingReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setFlyingReaction(null), 1800);
  }, []);

  const muteEveryone = useCallback(async () => {
    if (!isHost) return;
    try {
      await api.muteAll(meetingIdStr);
      const list = await api.participants(meetingIdStr);
      setParticipants(list);
    } catch {}
  }, [isHost, meetingIdStr]);

  const removeParticipant = useCallback(
    async (pid: number) => {
      if (!isHost) return;
      if (!confirm("Remove this participant from the meeting?")) return;
      try {
        await api.remove(meetingIdStr, pid);
        setParticipants((prev) => prev.filter((p) => p.id !== pid));
      } catch {}
    },
    [isHost, meetingIdStr],
  );

  const muteParticipant = useCallback(
    async (pid: number) => {
      if (!isHost) return;
      try {
        const next = await api.updateParticipant(meetingIdStr, pid, {
          is_muted: true,
        });
        setParticipants((prev) =>
          prev.map((p) => (p.id === next.id ? next : p)),
        );
      } catch {}
    },
    [isHost, meetingIdStr],
  );

  const copyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(meeting.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }, [meeting.invite_url]);

  /* ---- close popover on outside click ---- */
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowInfo(false);
        setShowViewMenu(false);
        setShowMoreMenu(false);
        setShowHostTools(false);
        setShowReactions(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ============================================================
     ENDED SCREEN
     ============================================================ */
  if (ended) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center text-white"
        style={{ background: "#131619" }}
      >
        <div
          className="rounded-[12px] p-8 text-center"
          style={{ background: "#1c1c1e" }}
        >
          <h1 className="text-[22px] font-semibold mb-2">Meeting ended</h1>
          <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            You have left the meeting.
          </p>
          <button
            type="button"
            onClick={() => router.push("/wc/home")}
            className="rounded-[20px] px-5 py-2 text-[14px] font-semibold text-white transition-colors"
            style={{ background: "#0e71eb" }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.background = "#2681f2")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.background = "#0e71eb")
            }
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     NAME GATE
     ============================================================ */
  if (needsName) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center text-white"
        style={{ background: "#131619" }}
      >
        <div
          className="w-full max-w-[360px] rounded-[12px] p-6"
          style={{ background: "#1c1c1e" }}
        >
          <h1 className="text-[20px] font-semibold mb-1">Join meeting</h1>
          <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
            {meeting.title}
          </p>
          <label className="mb-1 block text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            Your name
          </label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doJoin(nameInput.trim())}
            className="w-full h-10 rounded-[8px] px-4 text-[15px] text-white outline-none transition-all"
            style={{
              background: "#2b2d31",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            autoFocus
          />
          {error && (
            <div
              className="mt-3 rounded-[6px] px-3 py-2 text-[12px]"
              style={{ background: "rgba(222,40,40,0.25)", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={() => doJoin(nameInput.trim())}
            disabled={!nameInput.trim()}
            className="mt-4 w-full rounded-[20px] py-2.5 text-[14px] font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "#0e71eb" }}
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN MEETING ROOM
     ============================================================ */
  return (
    <div
      ref={rootRef}
      className="relative flex h-screen w-screen overflow-hidden select-none"
      style={{
        background: "#131619",
        fontFamily: 'system-ui, -apple-system, "Segoe UI", "Almaden Sans", Roboto, Ubuntu, Helvetica, Arial, sans-serif',
      }}
      onMouseMove={showBars}
      onClick={showBars}
    >
      {/* Static styles for header/footer glass background — kept out of inline style
          so React's style reconciliation cannot drop them */}
      <style>{`
        .mr-bar {
          background: rgba(0,0,0,0.7);
          transition: transform 0.2s ease-out;
        }
      `}</style>

      {/* ==========================================================
          MAIN CONTENT AREA (video + optional side panel)
          ========================================================== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ---- Video/gallery area ---- */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          style={{ background: "#0d0d0d" }}
        >
          {/* =====================================================
              MEETING HEADER BAR — inside video area so it doesn't
              bleed over the right panel
              ===================================================== */}
          <header
            className="mr-bar absolute top-0 left-0 right-0 z-[200] flex h-[48px] items-center justify-between px-[16px]"
            style={{ transform: barsVisible ? "translateY(0)" : "translateY(-48px)" }}
          >
            {/* Left: Zoom Workplace logo */}
            <div className="flex items-center gap-[12px]">
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-[400] text-white/70 tracking-wide">zoom</span>
                <span className="text-[14px] font-[600] text-white tracking-tight">Workplace</span>
              </div>
            </div>

            {/* Right: security badge | View button | avatar */}
            <div className="flex items-center gap-[12px]">
              {/* Security badge + meeting info */}
              <div className="relative flex items-center gap-[6px]">
                {/* Green shield */}
                <button
                  type="button"
                  onClick={() => setShowInfo((v) => !v)}
                  aria-label="Meeting security info"
                  className="flex items-center gap-[4px] rounded-[6px] px-[6px] py-[3px] hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                  style={{ background: showInfo ? "rgba(255,255,255,0.09)" : undefined }}
                >
                  <MImg name="security-shield" size={16} />
                </button>

                {/* Meeting info popover */}
                {showInfo && (
                  <div
                    className="absolute top-[calc(100%+8px)] right-0 z-[300] w-[420px] rounded-[12px] p-[24px]"
                    style={{
                      background: "rgba(0,0,0,0.93)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-[16px] font-[600] text-white mb-[16px]">
                      {meeting.title}
                    </h2>
                    <table className="w-full text-[13px]" style={{ borderSpacing: "0 8px", borderCollapse: "separate" }}>
                      <tbody>
                        <InfoRow label="Meeting ID" value={formatMeetingId(meeting.meeting_id)} />
                        <InfoRow label="Host" value={`${meeting.host_name ?? "—"}${isHost ? " (You)" : ""}`} />
                        {meeting.passcode && (
                          <InfoRow label="Passcode" value={meeting.passcode} />
                        )}
                        <InfoRow label="Encryption" value="Enabled" />
                        <tr>
                          <td className="pr-[16px] align-top whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                            Invite Link
                          </td>
                          <td className="text-white/80 break-all">
                            <div>{meeting.invite_url}</div>
                            <button
                              type="button"
                              onClick={copyInvite}
                              className="mt-[6px] flex items-center gap-[6px] text-[#0e71eb] hover:underline text-[13px]"
                            >
                              <Copy size={13} />
                              {copied ? "Copied!" : "Copy Link"}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-[12px] text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      You are connected to the Zoom Global Network.
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical divider */}
              <div
                className="h-[22px] w-[1px]"
                style={{ background: "rgba(255,255,255,0.2)" }}
              />

              {/* View button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowViewMenu((v) => !v)}
                  aria-label="View options"
                  className="flex items-center gap-[4px] rounded-[7px] px-[8px] py-[3px] text-[12px] font-[400] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                >
                  <MIcon name="view" size={14} color="white" />
                  <span>View</span>
                </button>

                {showViewMenu && (
                  <div
                    className="absolute top-[calc(100%+6px)] right-0 z-[300] w-[260px] rounded-[8px] py-[8px]"
                    style={{
                      background: "#202123",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(["speaker", "gallery"] as const).map((mode) => {
                      const labels: Record<string, string> = {
                        speaker: "Speaker View",
                        gallery: "Gallery View",
                      };
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => { setViewMode(mode); setShowViewMenu(false); }}
                          className="flex w-full items-center justify-between px-[12px] py-[7px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                        >
                          <span className="flex items-center gap-[8px]">
                            {viewMode === mode && <span className="text-[11px]">✓</span>}
                            {viewMode !== mode && <span className="w-[16px]" />}
                            {labels[mode]}
                          </span>
                          <MIcon name="view" size={14} color="rgba(255,255,255,0.5)" />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="flex w-full items-center gap-[8px] px-[12px] py-[7px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                    >
                      <span className="w-[16px]" />
                      Multi-speaker View
                      <MIcon name="view" size={14} color="rgba(255,255,255,0.5)" className="ml-auto" />
                    </button>
                    <div className="my-[4px] h-[1px] mx-[12px]" style={{ background: "rgba(255,255,255,0.1)" }} />
                    {["Sort Gallery By", "Follow Host's Video Order"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="flex w-full items-center px-[12px] py-[7px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                      >
                        <span className="w-[16px] mr-[8px]" />
                        {label}
                        {label === "Sort Gallery By" && <span className="ml-auto text-white/50">›</span>}
                      </button>
                    ))}
                    <div className="my-[4px] h-[1px] mx-[12px]" style={{ background: "rgba(255,255,255,0.1)" }} />
                    {["Hide Self View", "Hide Non-video Participants", "Fullscreen"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="flex w-full items-center px-[12px] py-[7px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                      >
                        <span className="w-[16px] mr-[8px]" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User avatar */}
              <div
                className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[12px] font-semibold text-white flex-shrink-0"
                style={{ background: colorFor(me?.display_name ?? preferredName) }}
              >
                {initials(me?.display_name ?? preferredName)}
              </div>
            </div>
          </header>

          {/* Participant name label (bottom-left, over video) — only for single-participant mode */}
          {participants.length === 1 && me && (
            <div
              className="absolute bottom-[4px] left-[4px] z-10 flex items-center gap-[4px] rounded-[4px] px-[5px] py-[3px] max-w-[calc(100%-8px)]"
              style={{ background: "rgba(0,0,0,0.56)" }}
            >
              <MIcon
                name={me.is_muted ? "mic-off" : "mic"}
                size={16}
                color={me.is_muted ? "#FF0055" : "#ffffff"}
              />
              <span
                className="text-[12px] font-[400] truncate"
                style={{ color: "#ffffff" }}
              >
                {me.display_name}
              </span>
            </div>
          )}

          {/* Participant gallery */}
          <VideoGrid
            participants={participants}
            meId={participantId}
            viewMode={viewMode}
          />
        </div>

        {/* ---- Right side panel ---- */}
        {panel && (
          <SidePanel
            kind={panel}
            participants={participants}
            isHost={isHost}
            meId={participantId}
            meeting={meeting}
            onClose={() => setPanel(null)}
            onMute={muteParticipant}
            onRemove={removeParticipant}
            onMuteAll={muteEveryone}
            copyInvite={copyInvite}
            copied={copied}
          />
        )}
      </div>

      {/* ==========================================================
          BOTTOM CONTROL BAR (footer, absolute overlay, full width)
          ========================================================== */}
      <footer
        className="mr-bar absolute bottom-0 left-0 right-0 z-[200] flex h-[52px] items-center justify-between px-[8px]"
        style={{ transform: barsVisible ? "translateY(0)" : "translateY(52px)" }}
      >
        {/* ---- LEFT group: Unmute + Video ---- */}
        <div className="flex items-center">
          {/* Unmute/Mute button */}
          <div className="relative">
            <ToolbarBtn
              label={me?.is_muted ? "Unmute" : "Mute"}
              onClick={toggleMuted}
              aria-label={me?.is_muted ? "Unmute microphone" : "Mute microphone"}
            >
              <MIcon
                name={me?.is_muted ? "mic-off" : "mic"}
                size={24}
                color={me?.is_muted ? "#FF0055" : "white"}
              />
            </ToolbarBtn>
            <ChevronBtn ariaLabel="Audio settings" />
          </div>

          {/* Video button */}
          <div className="relative">
            <ToolbarBtn
              label={me?.is_video_on ? "Stop Video" : "Start Video"}
              onClick={toggleVideo}
              aria-label={me?.is_video_on ? "Stop video" : "Start video"}
            >
              <MIcon
                name={me?.is_video_on ? "video" : "video-off"}
                size={24}
                color={me?.is_video_on ? "white" : "#FF0055"}
              />
            </ToolbarBtn>
            <ChevronBtn ariaLabel="Video settings" />
          </div>
        </div>

        {/* ---- CENTER group ---- */}
        <div className="flex items-center">
          {/* Participants — hidden on mobile (sm:flex = visible ≥640px) */}
          <div className="relative hidden sm:flex">
            <ToolbarBtn
              label={`Participants${participants.length ? ` (${participants.length})` : ""}`}
              onClick={() => setPanel(panel === "participants" ? null : "participants")}
              active={panel === "participants"}
            >
              <MIcon name="participants" size={24} color="white" />
            </ToolbarBtn>
            <ChevronBtn ariaLabel="Participants options" />
          </div>

          {/* Chat — hidden on mobile */}
          <div className="relative hidden sm:flex">
            <ToolbarBtn
              label="Chat"
              onClick={() => setPanel(panel === "chat" ? null : "chat")}
              active={panel === "chat"}
            >
              <MIcon name="chat" size={24} color="white" />
            </ToolbarBtn>
            <ChevronBtn ariaLabel="Chat options" />
          </div>

          {/* React — hidden on mobile */}
          <div className="relative hidden sm:flex">
            <ToolbarBtn
              label="React"
              onClick={() => { setShowReactions((v) => !v); setShowMoreMenu(false); setShowHostTools(false); }}
              active={showReactions}
            >
              <MIcon name="reactions" size={24} color="white" />
            </ToolbarBtn>

            {/* Reactions popover */}
            {showReactions && (
              <div
                className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-[300] rounded-[12px] p-[8px]"
                style={{
                  background: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(15px)",
                  WebkitBackdropFilter: "blur(15px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
                  minWidth: "296px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Row 1: emoji reactions */}
                <div className="flex items-center gap-[2px] mb-[4px]">
                  {["👏", "👍", "😂", "😮", "❤️", "🎉"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendReaction(emoji)}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[18px] hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                  {/* More emojis placeholder */}
                  <button
                    type="button"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                  >
                    <span className="text-[18px]">···</span>
                  </button>
                </div>
                {/* Row 2: NVF reactions */}
                <div className="flex items-center gap-[2px] mb-[6px]">
                  {["✅", "❌", "🐢", "🐇", "☕"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendReaction(emoji)}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[18px] hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Raise Hand */}
                <button
                  type="button"
                  onClick={() => { toggleHand(); setShowReactions(false); }}
                  className="flex w-full items-center justify-center gap-[8px] rounded-[8px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors mb-[4px]"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span>✋</span>
                  <span>{handRaised ? "Lower Hand" : "Raise Hand"}</span>
                </button>
                {/* Be right back */}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-[8px] rounded-[8px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span>⏳</span>
                  <span>Be right back</span>
                </button>
              </div>
            )}
          </div>

          {/* Share Screen */}
          <div className="relative hidden lg:flex">
            <ToolbarBtn label="Share">
              <MImg name="share-screen" size={24} />
            </ToolbarBtn>
            <ChevronBtn ariaLabel="Share screen options" />
          </div>

          {/* Host Tools (visible for host or always on desktop) */}
          <div className="relative hidden lg:flex">
            <ToolbarBtn
              label="Host tools"
              onClick={() => { setShowHostTools((v) => !v); setShowMoreMenu(false); setShowReactions(false); }}
              active={showHostTools}
            >
              <MIcon name="host-tools" size={24} color="white" />
            </ToolbarBtn>

            {/* Host tools popover */}
            {showHostTools && (
              <div
                className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-[300] w-[260px] rounded-[8px] py-[8px]"
                style={{
                  background: "#202123",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { label: "Lock Meeting" },
                  { label: "Enable waiting room" },
                  { label: "Hide profile pictures" },
                ].map(({ label }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex w-full items-center px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                  >
                    {label}
                  </button>
                ))}

                <div className="my-[4px] h-[1px] mx-[12px]" style={{ background: "rgba(255,255,255,0.1)" }} />

                <div className="px-[12px] py-[6px] text-[12px] font-[600]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Allow participants to:
                </div>
                {[
                  "Share Screen",
                  "Chat",
                  "Rename Themselves",
                  "Unmute Themselves",
                  "Start Video",
                  "Share Whiteboards",
                  "Transcribe in My Notes",
                ].map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                  >
                    <span className="text-[11px] text-white/50">✓</span>
                    {perm}
                  </button>
                ))}

                <div className="my-[4px] h-[1px] mx-[12px]" style={{ background: "rgba(255,255,255,0.1)" }} />

                <button
                  type="button"
                  onClick={muteEveryone}
                  className="flex w-full items-center px-[12px] py-[8px] text-[13px] transition-colors"
                  style={{ color: "#de2828" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  Suspend Participant Activities
                </button>
              </div>
            )}
          </div>

          {/* Zoom AI */}
          <div className="relative hidden lg:flex">
            <ToolbarBtn label="Zoom AI">
              <MIcon name="zoom-ai" size={24} color="white" />
            </ToolbarBtn>
          </div>

          {/* More (...) */}
          <div className="relative">
            <ToolbarBtn
              label="More"
              onClick={() => { setShowMoreMenu((v) => !v); setShowHostTools(false); setShowReactions(false); }}
              active={showMoreMenu}
            >
              <MIcon name="more" size={24} color="white" />
            </ToolbarBtn>

            {/* More menu popover */}
            {showMoreMenu && (
              <div
                className="absolute bottom-[calc(100%+12px)] right-0 z-[300] w-[220px] rounded-[8px] py-[8px]"
                style={{
                  background: "#202123",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-[10px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                >
                  <span className="text-[16px]">CC</span>
                  Captions
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-[10px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                >
                  <span>Whiteboards</span>
                  <span className="text-white/50">›</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-[10px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-[10px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                >
                  Stop Incoming Video
                </button>
                <div className="my-[4px] h-[1px] mx-[12px]" style={{ background: "rgba(255,255,255,0.1)" }} />
                <button
                  type="button"
                  className="flex w-full items-center gap-[10px] px-[12px] py-[8px] text-[13px] text-white hover:bg-[rgba(255,255,255,0.09)] transition-colors"
                >
                  Reset to default
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---- RIGHT group: End ---- */}
        <div className="flex items-center">
          <ToolbarBtn
            label="End"
            onClick={() => isHost ? setShowEndConfirm(true) : leaveMeeting()}
            aria-label={isHost ? "End meeting" : "Leave meeting"}
          >
            <MImg name="end" size={24} />
          </ToolbarBtn>
        </div>
      </footer>

      {/* ==========================================================
          FLYING REACTION ANIMATION
          ========================================================== */}
      {flyingReaction && (
        <div
          className="pointer-events-none absolute bottom-[80px] left-1/2 text-[56px] z-[500]"
          style={{ animation: "float 1.8s ease-out forwards" }}
        >
          {flyingReaction}
        </div>
      )}

      {/* ==========================================================
          END MEETING CONFIRMATION POPOVER
          ========================================================== */}
      {showEndConfirm && (
        <div
          className="absolute inset-0 z-[400] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowEndConfirm(false)}
        >
          <div
            className="w-[248px] rounded-[12px] p-[16px]"
            style={{
              background: "rgba(9,10,12,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-[600] text-white mb-[12px]">
              End meeting for everyone?
            </h2>
            <div className="flex flex-col gap-[8px]">
              <button
                type="button"
                onClick={endMeetingForAll}
                className="h-[32px] w-full rounded-[8px] text-[13px] font-[500] text-white transition-colors"
                style={{ background: "#de2828" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "#ca2424")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "#de2828")
                }
              >
                End for All
              </button>
              <button
                type="button"
                onClick={() => { setShowEndConfirm(false); leaveMeeting(); }}
                className="h-[32px] w-full rounded-[8px] text-[13px] font-[500] text-white transition-colors hover:bg-[rgba(255,255,255,0.18)]"
                style={{ background: "rgba(255,255,255,0.09)" }}
              >
                Leave Meeting
              </button>
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="h-[32px] w-full rounded-[8px] text-[13px] font-[500] transition-colors hover:bg-[rgba(255,255,255,0.09)]"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MEETING INFO TABLE ROW
   ============================================================ */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="pr-[16px] align-top whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </td>
      <td className="text-white">{value}</td>
    </tr>
  );
}

/* ============================================================
   MEETING TIMER HOOK
   ============================================================ */
function useMeetingTimer(startedAt: string | null | undefined, ended: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ended]);
  const startDate = parseServerDate(startedAt);
  if (!startDate) return "";
  const start = startDate.getTime();
  const secs = Math.max(0, Math.floor((now - start) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/* ============================================================
   VIDEO GRID
   ============================================================ */
function VideoGrid({
  participants,
  meId,
  viewMode,
}: {
  participants: Participant[];
  meId: number | null;
  viewMode: "speaker" | "gallery";
}) {
  const list = participants;
  const count = list.length;

  if (count === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ background: "#0d0d0d" }}
      >
        <div className="text-[14px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Waiting for participants…
        </div>
      </div>
    );
  }

  /* Single participant (speaker view default): full-bleed avatar on dark bg, no tile box */
  if (count === 1) {
    const p = list[0];
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ background: "#0d0d0d" }}
      >
        <div
          className="flex items-center justify-center rounded-full text-[32px] font-semibold text-white"
          style={{
            background: colorFor(p.display_name),
            width: "96px",
            height: "96px",
          }}
        >
          {initials(p.display_name)}
        </div>
      </div>
    );
  }

  if (viewMode === "speaker") {
    const speaker = list.find((p) => p.is_host) ?? list[0];
    const others = list.filter((p) => p.id !== speaker.id);
    return (
      <div className="flex h-full w-full gap-[8px] p-[8px]" style={{ background: "#0d0d0d" }}>
        <div className="relative flex-1 flex items-center justify-center rounded-[8px] overflow-hidden" style={{ background: "#1a1a1a" }}>
          <div
            className="flex items-center justify-center rounded-full text-[32px] font-semibold text-white"
            style={{
              background: colorFor(speaker.display_name),
              width: "96px",
              height: "96px",
            }}
          >
            {initials(speaker.display_name)}
          </div>
          {/* Name label on main tile */}
          <div
            className="absolute bottom-[4px] left-[4px] flex items-center gap-[4px] rounded-[4px] px-[5px] py-[3px] max-w-[calc(100%-8px)]"
            style={{ background: "rgba(0,0,0,0.56)" }}
          >
            <MIcon
              name={speaker.is_muted ? "mic-off" : "mic"}
              size={16}
              color={speaker.is_muted ? "#FF0055" : "#ffffff"}
            />
            <span className="text-[12px] font-[400] truncate" style={{ color: "#ffffff" }}>
              {speaker.display_name}
              {speaker.id === meId ? " (You)" : ""}
              {speaker.is_host ? " · Host" : ""}
            </span>
          </div>
        </div>
        {/* Sidebar thumbnails */}
        <div className="flex w-[160px] flex-col gap-[8px] overflow-y-auto dark-scroll">
          {others.map((p) => (
            <div key={p.id} className="relative shrink-0 h-[90px] rounded-[8px] overflow-hidden flex items-center justify-center" style={{ background: "#1a1a1a" }}>
              <div
                className="flex items-center justify-center rounded-full text-[18px] font-semibold text-white"
                style={{
                  background: colorFor(p.display_name),
                  width: "48px",
                  height: "48px",
                }}
              >
                {initials(p.display_name)}
              </div>
              <div
                className="absolute bottom-[2px] left-[2px] flex items-center gap-[3px] rounded-[3px] px-[4px] py-[2px] max-w-[calc(100%-4px)]"
                style={{ background: "rgba(0,0,0,0.56)" }}
              >
                <MIcon name={p.is_muted ? "mic-off" : "mic"} size={12} color={p.is_muted ? "#FF0055" : "#ffffff"} />
                <span className="text-[10px] font-[400] truncate" style={{ color: "#ffffff" }}>
                  {p.display_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Gallery view */
  const cols = count <= 4 ? 2 : count <= 9 ? 3 : 4;
  return (
    <div
      className="grid h-full w-full gap-[8px] p-[8px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, background: "#0d0d0d" }}
    >
      {list.map((p) => (
        <Tile key={p.id} p={p} isMe={p.id === meId} />
      ))}
    </div>
  );
}

/* ============================================================
   PARTICIPANT TILE
   ============================================================ */
function Tile({ p, isMe }: { p: Participant; isMe: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-[8px] overflow-hidden"
      style={{ background: "#1a1a1a", aspectRatio: "16/9", width: "100%" }}
    >
      {/* Avatar circle */}
      <div
        className="flex items-center justify-center rounded-full text-[24px] font-semibold text-white"
        style={{
          background: colorFor(p.display_name),
          width: "80px",
          height: "80px",
        }}
      >
        {initials(p.display_name)}
      </div>

      {/* Name label — bottom-left */}
      <div
        className="absolute bottom-[4px] left-[4px] flex items-center gap-[4px] rounded-[4px] px-[5px] py-[3px] max-w-[calc(100%-8px)]"
        style={{ background: "rgba(0,0,0,0.56)" }}
      >
        <MIcon
          name={p.is_muted ? "mic-off" : "mic"}
          size={16}
          color={p.is_muted ? "#FF0055" : "#ffffff"}
        />
        <span
          className="text-[12px] font-[400] truncate"
          style={{ color: "#ffffff" }}
        >
          {p.display_name}
          {isMe ? " (You)" : ""}
          {p.is_host ? " · Host" : ""}
        </span>
      </div>

      {/* Hand raise indicator */}
      {p.is_hand_raised && (
        <div
          className="absolute top-[4px] right-[4px] flex h-[28px] w-[28px] items-center justify-center rounded-full text-[16px]"
          style={{ background: "rgba(255,185,0,0.9)" }}
        >
          ✋
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SIDE PANEL (Participants / Chat)
   ============================================================ */
function SidePanel({
  kind,
  participants,
  isHost,
  meId,
  meeting,
  onClose,
  onMute,
  onRemove,
  onMuteAll,
  copyInvite,
  copied,
}: {
  kind: "participants" | "chat";
  participants: Participant[];
  isHost: boolean;
  meId: number | null;
  meeting: Meeting;
  onClose: () => void;
  onMute: (id: number) => void;
  onRemove: (id: number) => void;
  onMuteAll: () => void;
  copyInvite: () => void;
  copied: boolean;
}) {
  const [chatMsg, setChatMsg] = useState("");

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: "400px",
        background: "#040506",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex h-[48px] items-center justify-between px-[16px] shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="text-[15px] font-[600] text-white">
          {kind === "participants"
            ? `Participants (${participants.length})`
            : meeting.title}
        </span>
        <div className="flex items-center gap-[4px]">
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] hover:bg-[rgba(255,255,255,0.09)] transition-colors"
          >
            <X size={16} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>

      {/* ---- PARTICIPANTS panel ---- */}
      {kind === "participants" && (
        <>
          <ul className="flex-1 overflow-y-auto dark-scroll py-[8px]">
            {participants.map((p) => (
              <li
                key={p.id}
                className="group flex items-center gap-[10px] px-[16px] py-[8px] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                {/* Avatar */}
                <div
                  className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                  style={{ background: colorFor(p.display_name) }}
                >
                  {initials(p.display_name)}
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[13px] text-white">
                    {p.display_name}
                    {p.id === meId && (
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>
                        {" "}(You)
                      </span>
                    )}
                    {p.is_host && (
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>
                        , Host
                      </span>
                    )}
                  </div>
                </div>
                {/* Icons / host controls */}
                <div className="flex items-center gap-[6px]">
                  {p.is_hand_raised && (
                    <span className="text-[14px]">✋</span>
                  )}
                  <MIcon
                    name={p.is_muted ? "mic-off" : "mic"}
                    size={16}
                    color={p.is_muted ? "#FF0055" : "rgba(255,255,255,0.7)"}
                  />
                  <MIcon
                    name={p.is_video_on ? "video" : "video-off"}
                    size={16}
                    color={p.is_video_on ? "rgba(255,255,255,0.7)" : "#FF0055"}
                  />
                  {isHost && p.id !== meId && (
                    <div className="hidden group-hover:flex items-center gap-[4px] ml-[4px]">
                      {!p.is_muted && (
                        <button
                          type="button"
                          onClick={() => onMute(p.id)}
                          className="rounded-[4px] px-[6px] py-[2px] text-[11px] text-white transition-colors hover:bg-[rgba(255,255,255,0.18)]"
                          style={{ background: "rgba(255,255,255,0.09)" }}
                        >
                          Mute
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        className="rounded-[4px] px-[6px] py-[2px] text-[11px] transition-colors"
                        style={{
                          background: "rgba(222,40,40,0.2)",
                          color: "#fca5a5",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Bottom action bar for participants */}
          <div
            className="flex items-center justify-around px-[8px] py-[10px] shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              type="button"
              onClick={copyInvite}
              className="flex-1 mx-[4px] h-[32px] rounded-[6px] text-[13px] font-[500] text-white transition-colors hover:bg-[rgba(255,255,255,0.18)]"
              style={{ background: "rgba(255,255,255,0.09)" }}
            >
              {copied ? "Copied!" : "Invite"}
            </button>
            {isHost && (
              <>
                <button
                  type="button"
                  onClick={onMuteAll}
                  className="flex-1 mx-[4px] h-[32px] rounded-[6px] text-[13px] font-[500] text-white transition-colors hover:bg-[rgba(255,255,255,0.18)]"
                  style={{ background: "rgba(255,255,255,0.09)" }}
                >
                  Mute All
                </button>
                <button
                  type="button"
                  className="flex-1 mx-[4px] h-[32px] rounded-[6px] text-[13px] font-[500] text-white transition-colors hover:bg-[rgba(255,255,255,0.18)]"
                  style={{ background: "rgba(255,255,255,0.09)" }}
                >
                  More
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ---- CHAT panel ---- */}
      {kind === "chat" && (
        <>
          {/* Sub-header: "Messages addressed to Meeting Group Chat..." */}
          <div
            className="px-[16px] py-[12px] text-center text-[12px] shrink-0"
            style={{
              color: "rgba(255,255,255,0.5)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Messages addressed to &quot;Meeting Group Chat&quot; will also appear in
            the meeting group chat in Team Chat
          </div>

          {/* Message area */}
          <div className="flex-1 overflow-y-auto dark-scroll px-[16px] py-[8px]">
            <div className="flex h-full items-center justify-center text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              No messages yet
            </div>
          </div>

          {/* Chat input area */}
          <div
            className="shrink-0 px-[12px] py-[10px]"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* "to: Meeting Group Chat" pill */}
            <div className="flex items-center gap-[6px] mb-[6px]">
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>to:</span>
              <span
                className="rounded-[12px] px-[10px] py-[2px] text-[12px] font-[500] text-white"
                style={{ background: "#0e71eb" }}
              >
                Meeting Group Chat
              </span>
            </div>
            {/* Who can see */}
            <div className="mb-[6px] flex items-center gap-[4px] text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>👤</span>
              <span>Who can see your messages?</span>
            </div>
            {/* Input box */}
            <textarea
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Type message here ..."
              rows={2}
              className="w-full resize-none rounded-[8px] px-[10px] py-[8px] text-[13px] outline-none transition-colors"
              style={{
                background: "#1d1e20",
                color: "#f5f7fb",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.border = "1px solid rgba(14,113,235,0.6)")
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.border = "1px solid rgba(255,255,255,0.1)")
              }
            />
            {/* Toolbar icons for chat */}
            <div className="flex items-center gap-[4px] mt-[6px]">
              <button type="button" className="h-[26px] w-[26px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(255,255,255,0.09)] transition-colors text-[14px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                📎
              </button>
              <button type="button" className="h-[26px] w-[26px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(255,255,255,0.09)] transition-colors text-[14px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                🖼
              </button>
              <button type="button" className="h-[26px] w-[26px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(255,255,255,0.09)] transition-colors text-[14px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                😊
              </button>
              <button type="button" className="h-[26px] w-[26px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(255,255,255,0.09)] transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
                ···
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
