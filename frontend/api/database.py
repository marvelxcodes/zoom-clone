import os
from pathlib import Path
from typing import Optional

from sqlmodel import Session, SQLModel, create_engine


def _resolve_local_db_path() -> Path:
    """Path for the on-disk SQLite fallback (local dev / no Turso set)."""
    override = os.environ.get("ZOOM_CLONE_DB_PATH")
    if override:
        return Path(override)
    if os.environ.get("VERCEL") == "1":
        # Vercel's filesystem is read-only outside /tmp.
        return Path("/tmp/zoom_clone.db")
    return Path(__file__).resolve().parent.parent / "zoom_clone.db"


def _turso_engine_args() -> Optional[tuple[str, dict]]:
    """Return (url, connect_args) for Turso, or None when env vars are unset.

    The auth token goes through `connect_args` — passing it in the URL query
    string leaves the libsql client without a JWT (SQLAlchemy consumes the
    query params before the dialect sees them) and Turso replies 401
    "empty JWT token".
    """
    raw = os.environ.get("TURSO_DATABASE_URL")
    token = os.environ.get("TURSO_AUTH_TOKEN")
    if not raw:
        return None

    # Normalise the scheme to what sqlalchemy-libsql expects.
    if raw.startswith("libsql://"):
        url = "sqlite+libsql://" + raw[len("libsql://") :]
    elif raw.startswith("https://"):
        url = "sqlite+libsql://" + raw[len("https://") :]
    else:
        url = raw

    # Strip any pre-embedded query params (we're passing them via connect_args).
    if "?" in url:
        url = url.split("?", 1)[0]
    # Canonical form has a trailing slash so the URL parser sees an empty
    # "database" segment.
    if not url.endswith("/"):
        url += "/"

    connect_args: dict = {"secure": True}
    if token:
        connect_args["auth_token"] = token
    return url, connect_args


_turso = _turso_engine_args()

if _turso:
    DATABASE_URL, _connect_args = _turso
    DB_PATH: Optional[Path] = None
    engine = create_engine(DATABASE_URL, echo=False, connect_args=_connect_args)
else:
    DB_PATH = _resolve_local_db_path()
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )


def init_db() -> None:
    from . import models  # noqa: F401 -- register models before create_all

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
