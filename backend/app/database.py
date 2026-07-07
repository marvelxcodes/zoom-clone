import os
from pathlib import Path
from typing import Optional

from sqlmodel import Session, SQLModel, create_engine


def _resolve_local_db_path() -> Path:
    """Path for the on-disk SQLite fallback (local dev / no Turso set)."""
    override = os.environ.get("ZOOM_CLONE_DB_PATH")
    if override:
        return Path(override)
    return Path(__file__).resolve().parent.parent / "zoom_clone.db"


def _turso_engine_args() -> Optional[tuple[str, dict]]:
    """Return (url, connect_args) for Turso, or None when env vars are unset.

    The auth token goes through `connect_args` because SQLAlchemy consumes
    the URL query string before the libsql dialect sees it, so a token
    embedded in the URL never reaches the driver (Turso replies 401
    "empty JWT token"). `secure=True` is implied by the `libsql://`
    scheme and must NOT be passed as a kwarg — libsql-experimental's
    `connect()` doesn't accept it and raises `TypeError`.
    """
    raw = os.environ.get("TURSO_DATABASE_URL")
    token = os.environ.get("TURSO_AUTH_TOKEN")
    if not raw:
        return None

    if raw.startswith("libsql://"):
        url = "sqlite+libsql://" + raw[len("libsql://") :]
    elif raw.startswith("https://"):
        url = "sqlite+libsql://" + raw[len("https://") :]
    else:
        url = raw

    if "?" in url:
        url = url.split("?", 1)[0]
    if not url.endswith("/"):
        url += "/"

    connect_args: dict = {}
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
