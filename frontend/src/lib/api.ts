import type { Meeting, Participant, User } from "./types";

// The FastAPI app registers all routes under `/api`; the frontend call
// sites still use unprefixed paths for readability, so we prepend the
// prefix here.
const API_PREFIX = "/api";

/**
 * Resolve the base URL for API calls.
 *
 * Server-side priority:
 *   1. `next/headers` host (echoes the incoming request's own domain — this
 *      dodges Vercel Deployment Protection, which gates `VERCEL_URL` but
 *      leaves the canonical/prod URL public).
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — canonical prod URL on Vercel.
 *   3. `VERCEL_URL` — per-deployment URL (only unprotected in production).
 *   4. `NEXT_PUBLIC_API_URL` — local dev override (points at uvicorn).
 *   5. `http://localhost:PORT` — last-resort local fallback.
 *
 * Client-side: same-origin unless `NEXT_PUBLIC_API_URL` was baked in at
 * build time (local dev only — do NOT set this on Vercel).
 */
async function resolveBaseUrl(): Promise<string> {
  if (typeof window === "undefined") {
    try {
      // Dynamic import so the client bundle doesn't pull in `next/headers`.
      const { headers } = await import("next/headers");
      const h = await headers();
      const host = h.get("host");
      if (host) {
        const proto = h.get("x-forwarded-proto")
          ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
        return `${proto}://${host}`;
      }
    } catch {
      // `next/headers` is only available inside a request scope; fall through.
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return `http://localhost:${process.env.PORT ?? 3000}`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const base = await resolveBaseUrl();
  const res = await fetch(`${base}${API_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: init?.cache ?? "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<User>("/me"),
  upcoming: () => request<Meeting[]>("/meetings/upcoming"),
  recent: () => request<Meeting[]>("/meetings/recent"),
  meeting: (id: string) => request<Meeting>(`/meetings/${id}`),
  createInstant: (title?: string) =>
    request<Meeting>("/meetings/instant", {
      method: "POST",
      body: JSON.stringify({ title: title ?? null }),
    }),
  schedule: (data: {
    title: string;
    description: string;
    passcode?: string | null;
    scheduled_start: string;
    duration_minutes: number;
  }) =>
    request<Meeting>("/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  validate: (id: string, passcode?: string) =>
    request<{ ok: boolean; message: string }>(`/meetings/${id}/validate`, {
      method: "POST",
      body: JSON.stringify({
        display_name: "check",
        passcode: passcode || null,
      }),
    }),
  join: (
    id: string,
    data: {
      display_name: string;
      passcode?: string | null;
      video_on?: boolean;
      muted?: boolean;
    },
  ) =>
    request<Participant>(`/meetings/${id}/participants`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  participants: (id: string) =>
    request<Participant[]>(`/meetings/${id}/participants`),
  updateParticipant: (
    meetingId: string,
    participantId: number,
    data: Partial<Pick<Participant, "is_muted" | "is_video_on" | "is_hand_raised">>,
  ) =>
    request<Participant>(
      `/meetings/${meetingId}/participants/${participantId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),
  leave: (meetingId: string, participantId: number) =>
    request<{ ok: boolean }>(
      `/meetings/${meetingId}/participants/${participantId}/leave`,
      { method: "POST" },
    ),
  remove: (meetingId: string, participantId: number) =>
    request<{ ok: boolean }>(
      `/meetings/${meetingId}/participants/${participantId}/remove`,
      { method: "POST" },
    ),
  muteAll: (meetingId: string) =>
    request<{ ok: boolean; message: string }>(
      `/meetings/${meetingId}/participants/mute-all`,
      { method: "POST" },
    ),
};
