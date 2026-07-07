from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from .database import get_session, init_db
from .routers import meetings, participants
from .routers.meetings import _default_user
from .schemas import UserOut

# The frontend calls every endpoint under `/api/*` (same-origin on Vercel,
# absolute URL locally). Keep this legacy backend in sync with the Vercel
# entrypoint at `frontend/api/index.py`.
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
    init_db()


@app.get(f"{API_PREFIX}", tags=["health"])
def health():
    return {"ok": True, "service": "zoom-clone-api"}


@app.get(f"{API_PREFIX}/me", response_model=UserOut, tags=["user"])
def get_me(session: Session = Depends(get_session)):
    return _default_user(session)


app.include_router(meetings.router, prefix=API_PREFIX)
app.include_router(participants.router, prefix=API_PREFIX)
