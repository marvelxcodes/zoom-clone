"""Vercel Python serverless entrypoint.

Vercel picks up this file because it lives at `<project-root>/api/index.py`
and detects the ASGI `app` symbol via its Python runtime. The `vercel.json`
rewrite ensures that every request under `/api/*` is dispatched to this
function; FastAPI then matches against routes that are already prefixed
with `/api`, so the path FastAPI sees matches the routes we declare.

Local dev: `uvicorn api.index:app --reload --host 127.0.0.1 --port 8000`
(runs from the `frontend/` directory).
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from .database import get_session
from .routers import meetings, participants
from .routers.meetings import _default_user
from .schemas import UserOut
from .seed import seed_if_empty

API_PREFIX = "/api"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # `seed_if_empty` is idempotent: it initialises tables and only inserts
    # sample rows when the DB is empty. On Vercel we run against `/tmp` so
    # each cold container gets a fresh seeded DB; locally it becomes a no-op
    # once you've run `python -m api.seed`.
    seed_if_empty()
    yield


app = FastAPI(title="Zoom Clone API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{API_PREFIX}", tags=["health"])
@app.get(f"{API_PREFIX}/", tags=["health"], include_in_schema=False)
def health():
    return {"ok": True, "service": "zoom-clone-api"}


@app.get(f"{API_PREFIX}/me", response_model=UserOut, tags=["user"])
def get_me(session: Session = Depends(get_session)):
    return _default_user(session)


app.include_router(meetings.router, prefix=API_PREFIX)
app.include_router(participants.router, prefix=API_PREFIX)
