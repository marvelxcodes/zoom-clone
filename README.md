# Zoom Clone

Preview: https://zoom-clone-gilt-five.vercel.app/
Note: Backend might be slow because it is deployed on US Region(Free tier limits)

A functional Zoom web app clone with a Next.js (App Router) frontend and a Python FastAPI + libSQL backend. Users can start instant meetings, join by ID, schedule meetings, and participate in a meeting room with host controls (mute all, remove participant) — without any real video streaming.

Deployed as **two services**: the Next.js frontend on **Vercel** and the FastAPI backend on **Render**, with the browser calling the Render URL cross-origin.

## Tech stack

| Layer    | Choice                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16.2 (App Router, Turbopack, React Compiler), React 19.2, Tailwind CSS v4, lucide-react, date-fns |
| Backend  | Python 3.11+, FastAPI, SQLModel (SQLAlchemy), Pydantic v2, uvicorn                                        |
| Database | [Turso](https://turso.tech/) (libSQL) in production; local SQLite file for dev/RL Env                     |
| Tooling  | Bun package manager, Biome (lint/format)                                                                  |
| Hosting  | Vercel (frontend) + Render (backend)                                                                      |

## Project layout

```
zoom-clone/
├── README.md
├── render.yaml                 # Render blueprint (backend service)
├── frontend/                   # → deployed to Vercel (Root Directory = frontend)
│   ├── src/
│   │   ├── app/                # /wc/home, /wc/join, /wc/[meetingId]/start, /meeting/schedule
│   │   ├── components/
│   │   └── lib/{api,types,utils}.ts
│   ├── package.json
│   ├── next.config.ts
│   └── .env.local              # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 (dev)
└── backend/                    # → deployed to Render (Root Directory = backend)
    ├── app/
    │   ├── main.py             # ASGI FastAPI app, all routes under /api
    │   ├── database.py         # SQLite engine → Turso when env vars set
    │   ├── models.py           # SQLModel tables: User, Meeting, Participant
    │   ├── schemas.py          # Pydantic v2 request/response schemas
    │   ├── utils.py            # ID / invite URL helpers
    │   ├── seed.py             # `python -m app.seed` + startup seeder
    │   └── routers/{meetings,participants}.py
    ├── requirements.txt
    └── seed.py                 # CLI shim → app.seed:reset_and_seed
```

## Local setup

Two terminals from the repo root.

### Terminal 1 — Backend (uvicorn)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                       # optional — reset & re-seed local SQLite
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Leave `TURSO_DATABASE_URL` unset to write to `backend/zoom_clone.db`.

### Terminal 2 — Frontend

```bash
cd frontend
bun install
bun run dev
```

`frontend/.env.local` already sets `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` so the browser hits your local backend. App at http://localhost:3000.

## Pages

| Path                    | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `/`                     | Redirects to `/wc/home`                                               |
| `/wc/home`              | Landing dashboard — profile, action buttons, upcoming/recent meetings |
| `/wc/join`              | Join by meeting ID + display name + optional passcode                 |
| `/meeting/schedule`     | Create a scheduled meeting (title, date/time, duration, passcode)     |
| `/wc/{meetingId}/start` | Meeting room — video-grid layout, participants panel, host controls   |

Query params on the meeting room:

- `host=1` — the current user auto-joins as the host with their profile name
- `name=<display name>` — pre-fill the display name (skip the join gate)
- `muted=0|1`, `video=0|1` — initial mic/camera state
- `pwd=<passcode>` — passcode

## API surface

All routes are mounted under `/api`.

| Method | Path                                           | Purpose                                       |
| ------ | ---------------------------------------------- | --------------------------------------------- |
| GET    | `/api`                                         | Health                                        |
| GET    | `/api/me`                                      | Current default user                          |
| GET    | `/api/meetings/upcoming`                       | Scheduled meetings in the future              |
| GET    | `/api/meetings/recent`                         | Ended meetings, most recent first             |
| POST   | `/api/meetings/instant`                        | Create + start an instant meeting             |
| POST   | `/api/meetings/schedule`                       | Schedule a meeting (returns invite/join URLs) |
| GET    | `/api/meetings/{id}`                           | Meeting details                               |
| POST   | `/api/meetings/{id}/validate`                  | Verify passcode for join                      |
| POST   | `/api/meetings/{id}/start` / `/end`            | Change meeting status                         |
| GET    | `/api/meetings/{id}/participants`              | Live participant list                         |
| POST   | `/api/meetings/{id}/participants`              | Join meeting                                  |
| PATCH  | `/api/meetings/{id}/participants/{pid}`        | Toggle mute/video/hand                        |
| POST   | `/api/meetings/{id}/participants/{pid}/leave`  | Leave meeting                                 |
| POST   | `/api/meetings/{id}/participants/{pid}/remove` | Host removes participant                      |
| POST   | `/api/meetings/{id}/participants/mute-all`     | Host mutes all non-host participants          |

## Database schema

Three tables (see `backend/app/models.py`):

- **user** — `id, name, email, avatar_color, created_at`
- **meeting** — `id, meeting_id (unique), host_id, title, description, passcode, scheduled_start, duration_minutes, status, is_instant, started_at, ended_at`
- **participant** — `id, meeting_id, display_name, user_id?, is_host, is_muted, is_video_on, is_hand_raised, joined_at, left_at, removed`

The first person to join a meeting becomes the host if there isn't one already; when joining via the "New Meeting" shortcut (`?host=1`), the default user's name is used and they are marked host on their participant row.

## Assumptions

- **No authentication.** The backend has a single default user (`Alex Chen`) served from `GET /api/me`. Any request the app makes acts as this user.
- **No real audio/video streaming.** Tiles render an avatar with the participant's initials; mic/camera toggles only flip a database flag.
- **State polling.** The meeting room polls `/participants` every 2.5s instead of using WebSockets. Sufficient for a demo / RL gym environment.
- **Per-tab identity in the meeting room.** The joined participant ID is stored in `sessionStorage`, so opening a meeting URL in a new tab lets the new tab join as a distinct participant. Great for testing multi-user flows locally.
- **Timezone handling.** SQLite stores naive UTC datetimes; the frontend appends `Z` before parsing so the meeting timer and scheduled times are correct regardless of the browser timezone.
- **Durable state via Turso.** When `TURSO_DATABASE_URL` is set the backend talks to Turso Cloud over libSQL; without it we fall back to a local SQLite file. Seeding is guarded by an empty-DB check so redeploys don't clobber real data.
- **Passcodes** are optional. Scheduled meetings auto-generate a passcode when the field is left blank; instant meetings never require one.

## Sample data (from `backend/app/seed.py`)

- 5 users with distinct avatar colors
- 4 upcoming meetings (in the next few days) hosted by Alex Chen
- 3 recent (ended) meetings
- Fresh unique 11-digit meeting IDs each run

## Development notes

- Next.js 16 makes `params` and `searchParams` promises — all pages `await` them.
- Turbopack is on by default in both `next dev` and `next build`.
- The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`).
- Tailwind v4 is used with the CSS `@theme` directive (see `src/app/globals.css`) instead of a `tailwind.config.js`.
- FastAPI's `on_startup` hook calls `seed_if_empty()` — safe to invoke on every process start; it inserts sample rows only when the DB has no users.
