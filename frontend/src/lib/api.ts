import type { Meeting, Participant, User } from "./types";

// The FastAPI app registers all routes under `/api`; the frontend call
// sites still use unprefixed paths for readability, so we prepend the
// prefix here.
const API_PREFIX = "/api";

/**
 * Resolve the base URL for API calls.
 *
 * On Vercel `NEXT_PUBLIC_API_URL` is ignored so a stray `.env.local` value
 * or dashboard env can't point the deployed client at localhost. Vercel
 * requests always stay same-origin (client) or self-referential via
 * `VERCEL_URL` (server components — Node's `fetch` needs absolute URLs).
 *
 * Locally, `NEXT_PUBLIC_API_URL` still points client + server at the
 * standalone uvicorn server (default `http://127.0.0.1:8000`).
 */
const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_ENV;

function resolveBaseUrl(): string {
  if (IS_VERCEL) {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "";
  }
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit;
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const API_URL = IS_VERCEL ? "" : process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const res = await fetch(`${resolveBaseUrl()}${API_PREFIX}${path}`, {
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
