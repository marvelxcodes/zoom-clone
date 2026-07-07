"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function JoinForm({
  initialMeetingId = "",
  initialPasscode = "",
  currentUserName = "You",
}: {
  initialMeetingId?: string;
  initialPasscode?: string;
  currentUserName?: string;
}) {
  const router = useRouter();
  const [meetingIdInput, setMeetingIdInput] = useState(initialMeetingId);
  const [passcode, setPasscode] = useState(initialPasscode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasscode, setShowPasscode] = useState(!!initialPasscode);

  function parseMeetingId(input: string): string {
    const digits = input.replace(/[^0-9]/g, "");
    if (digits.length >= 9) return digits;
    return input.trim();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const id = parseMeetingId(meetingIdInput);
      const m = await api.meeting(id);
      if (m.status === "ended") {
        throw new Error("This meeting has already ended.");
      }
      if (m.passcode) {
        if (!passcode) {
          setShowPasscode(true);
          throw new Error("This meeting requires a passcode.");
        }
        await api.validate(id, passcode);
      }
      const search = new URLSearchParams({ name: currentUserName });
      if (passcode) search.set("pwd", passcode);
      router.push(`/wc/${id}/start?${search.toString()}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input
        value={meetingIdInput}
        onChange={(e) => setMeetingIdInput(e.target.value)}
        placeholder="Meeting ID or Personal Link Name"
        className="w-full h-10 rounded-xl border border-zoom-border px-4 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
        required
        autoFocus
      />

      {showPasscode && (
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="w-full h-10 rounded-xl border border-zoom-border px-4 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
        />
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zoom-border-subtle bg-white px-4 py-1.5 text-[13px] font-medium text-zoom-text hover:bg-zoom-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !meetingIdInput.trim()}
          className="rounded-md bg-zoom-blue px-5 py-1.5 text-[13px] font-semibold text-white hover:bg-zoom-blue-dark disabled:bg-zoom-border-subtle disabled:text-zoom-muted transition-colors"
        >
          {busy ? "Joining…" : "Join"}
        </button>
      </div>
    </form>
  );
}
