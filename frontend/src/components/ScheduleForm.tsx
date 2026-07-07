"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import type { Meeting } from "@/lib/types";
import { parseServerDate } from "@/lib/utils";
import CopyLinkButton from "./CopyLinkButton";

function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ScheduleForm() {
  const router = useRouter();
  const [title, setTitle] = useState("My Meeting");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(() => toLocalInput(defaultStart()));
  const [duration, setDuration] = useState(60);
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startPreview = useMemo(() => {
    try {
      return format(new Date(start), "EEE, MMM d · h:mm a");
    } catch {
      return "";
    }
  }, [start]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const m = await api.schedule({
        title: title.trim() || "My Meeting",
        description: description.trim(),
        passcode: passcode.trim() || null,
        scheduled_start: new Date(start).toISOString(),
        duration_minutes: duration,
      });
      setCreated(m);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-xl border border-zoom-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-green-700">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Meeting scheduled</span>
        </div>
        <h2 className="text-xl font-semibold">{created.title}</h2>
        <p className="mt-1 text-sm text-zoom-muted">
          {(() => {
            const d = parseServerDate(created.scheduled_start);
            return d ? format(d, "EEEE, MMM d 'at' h:mm a") : "";
          })()}{" "}
          · {created.duration_minutes} min
        </p>
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="w-28 text-zoom-muted">Meeting ID</span>
            <span className="font-medium">{created.meeting_id}</span>
          </div>
          {created.passcode && (
            <div className="flex items-baseline gap-2">
              <span className="w-28 text-zoom-muted">Passcode</span>
              <span className="font-medium">{created.passcode}</span>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="w-28 text-zoom-muted">Invite link</span>
            <span className="break-all font-mono text-xs">
              {created.invite_url}
            </span>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <CopyLinkButton url={created.invite_url} label="Copy invitation" />
          <button
            type="button"
            onClick={() => router.push("/wc/home")}
            className="rounded-[20px] border border-zoom-blue bg-white px-4 py-1.5 text-sm font-semibold text-zoom-blue hover:bg-zoom-blue/5"
          >
            Back to Home
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setTitle("My Meeting");
              setDescription("");
            }}
            className="rounded-[20px] bg-zoom-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-zoom-blue-dark"
          >
            Schedule another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-xl border border-zoom-border bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-zoom-muted">
          Topic
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-10 rounded-xl border border-zoom-border px-4 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zoom-muted">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-zoom-border px-4 py-2 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zoom-muted">
            Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full h-10 rounded-xl border border-zoom-border px-4 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
            required
          />
          {startPreview && (
            <p className="mt-1 text-xs text-zoom-muted">{startPreview}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zoom-muted">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-10 rounded-xl border border-zoom-border bg-white px-3 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
          >
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? "s" : ""}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zoom-muted">
          Passcode (optional)
        </label>
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Auto-generated if empty"
          className="w-full max-w-xs h-10 rounded-xl border border-zoom-border px-4 text-[15px] outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[20px] bg-zoom-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-zoom-blue-dark disabled:bg-zoom-border-subtle disabled:text-zoom-muted transition-colors"
        >
          {busy ? "Scheduling…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/wc/home")}
          className="rounded-[20px] border border-zoom-blue bg-white px-5 py-2.5 text-sm font-semibold text-zoom-blue hover:bg-zoom-blue/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
