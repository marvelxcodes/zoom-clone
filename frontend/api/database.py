import os
from pathlib import Path
from typing import Optional
from urllib.parse import quote

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


def _turso_url() -> Optional[str]:
    """Build a SQLAlchemy URL for Turso if the required env vars are present.

    Accepts either:
      - `TURSO_DATABASE_URL=libsql://<db>.turso.io` + `TURSO_AUTH_TOKEN=<token>`
      - `TURSO_DATABASE_URL` already containing `?authToken=...&secure=true`
    """
    raw = os.environ.get("TURSO_DATABASE_URL")
    if not raw:
        return None

    # sqlalchemy-libsql speaks `sqlite+libsql://`, so normalise from `libsql://`.
    if raw.startswith("libsql://"):
        url = "sqlite+libsql://" + raw[len("libsql://") :]
    elif raw.startswith(("sqlite+libsql://", "https://")):
        url = raw.replace("https://", "sqlite+libsql://", 1) if raw.startswith("https://") else raw
    else:
        url = raw

    token = os.environ.get("TURSO_AUTH_TOKEN")
    if token and "authToken=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}authToken={quote(token)}&secure=true"
    elif "secure=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}secure=true"
    return url


_turso = _turso_url()

if _turso:
    DATABASE_URL = _turso
    DB_PATH: Optional[Path] = None
    engine = create_engine(DATABASE_URL, echo=False)
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
