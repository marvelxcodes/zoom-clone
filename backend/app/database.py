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
    return Path(__file__).resolve().parent.parent / "zoom_clone.db"


def _turso_url() -> Optional[str]:
    """Build the sqlalchemy-libsql URL for Turso, or None when env is unset.

    The dialect (see `sqlalchemy_libsql/libsql.py`) requires three query
    params to talk to a remote libSQL server:

      * `uri=true`     — otherwise the dialect falls back to `url.database`
                         which is empty for `sqlite+libsql://host/`, so it
                         opens `:memory:` and ignores Turso entirely.
      * `secure=true`  — picks the `https://` scheme when the dialect
                         constructs the underlying network URL. Without
                         this it uses `http://` and Turso answers with
                         "308 Permanent Redirect, body=Redirecting".
      * `authToken=…`  — forwarded verbatim into the network URL so
                         libsql-experimental can authenticate.
    """
    raw = os.environ.get("TURSO_DATABASE_URL")
    token = os.environ.get("TURSO_AUTH_TOKEN")
    if not raw:
        return None

    if raw.startswith("libsql://"):
        host = raw[len("libsql://") :]
    elif raw.startswith("https://"):
        host = raw[len("https://") :]
    elif raw.startswith("sqlite+libsql://"):
        host = raw[len("sqlite+libsql://") :]
    else:
        host = raw

    # Drop any pre-existing query string / path; we re-build them below.
    host = host.split("/", 1)[0].split("?", 1)[0]

    params = ["secure=true", "uri=true"]
    if token:
        # Order matters for readability only; libsql doesn't care.
        params.insert(0, f"authToken={quote(token, safe='')}")
    return f"sqlite+libsql://{host}/?{'&'.join(params)}"


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
