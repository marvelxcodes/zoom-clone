import type { Meeting, Participant, User } from "./types";

// The FastAPI app registers all routes under `/api`; the frontend call
// sites still use unprefixed paths for readability, so we prepend the
// prefix here.
const API_PREFIX = "/api";

/**
 * Resolve the base URL for API calls.
 *
 * - Server-side on Vercel: `VERCEL_URL` is set by the platform, so RSC
 *   fetches hit the same deployment's `/api/*` function via HTTPS. Node's
 *   `fetch` refuses relative URLs, so this must be absolute.
 * - Server-side locally: honor `NEXT_PUBLIC_API_URL` (points at uvicorn)
 *   or fall back to `http://localhost:PORT`.
 * - Client-side: same-origin unless `NEXT_PUBLIC_API_URL` was baked into
 *   the build. On Vercel that env var should be *unset* so the client
 *   uses the rewrite; locally it points at the uvicorn server.
 */
function resolveBaseUrl(): string {
  if (typeof window === "undefined") {
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
