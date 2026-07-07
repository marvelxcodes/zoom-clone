from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from .database import get_session
from .routers import meetings, participants
from .routers.meetings import _default_user
from .schemas import UserOut
from .seed import seed_if_empty

# Frontend calls every endpoint under `/api/*`. This is a standalone
# FastAPI service — deployed to Render, called cross-origin by the
# Next.js frontend on Vercel.
API_PREFIX = "/api"

app = FastAPI(title="Zoom Clone API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Idempotent: creates tables and only inserts sample rows when the DB
    # is empty. Safe to run on every process start.
    seed_if_empty()


@app.get(f"{API_PREFIX}", tags=["health"])
def health():
    return {"ok": True, "service": "zoom-clone-api"}


@app.get(f"{API_PREFIX}/me", response_model=UserOut, tags=["user"])
def get_me(session: Session = Depends(get_session)):
    return _default_user(session)


app.include_router(meetings.router, prefix=API_PREFIX)
app.include_router(participants.router, prefix=API_PREFIX)
