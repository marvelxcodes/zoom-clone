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


def _turso_config() -> Optional[tuple[str, str]]:
    """Return (libsql_url, auth_token) when both Turso env vars are set."""
    raw = os.environ.get("TURSO_DATABASE_URL")
    token = os.environ.get("TURSO_AUTH_TOKEN")
    if not raw or not token:
        return None

    # Normalise: strip a `sqlite+libsql://` prefix if the user pasted the
    # SQLAlchemy form; keep `libsql://` / `https://` intact — both are
    # accepted natively by libsql-experimental's `connect()`.
    if raw.startswith("sqlite+libsql://"):
        raw = "libsql://" + raw[len("sqlite+libsql://") :]
    # Drop any query string; auth flows through the kwarg.
    raw = raw.split("?", 1)[0].rstrip("/")
    return raw, token


_turso = _turso_config()

if _turso:
    _turso_url, _turso_token = _turso
    DB_PATH: Optional[Path] = None
    DATABASE_URL = _turso_url

    # Bypass sqlalchemy-libsql's URL munging (which rewrites the URL to
    # `https://<host>?authToken=…`; Turso's HTTP endpoint answers that
    # with "308 Permanent Redirect" during `PRAGMA read_uncommitted`).
    # Instead hand SQLAlchemy a plain callable that opens a libsql
    # connection with the token as a proper kwarg — libsql-experimental
    # handles the `libsql://` scheme (WebSocket over TLS) directly.
    def _make_conn():
        import libsql_experimental as libsql

        return libsql.connect(_turso_url, auth_token=_turso_token)

    engine = create_engine(
        "sqlite+libsql://",
        creator=_make_conn,
        echo=False,
    )
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
