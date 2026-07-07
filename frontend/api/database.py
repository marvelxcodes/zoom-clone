import os
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine


def _resolve_db_path() -> Path:
    """Pick a writable path for the SQLite file.

    Vercel's Lambda-style filesystem is read-only except `/tmp`. Locally we
    keep the DB next to the API package so `uvicorn api.index:app` behaves
    the same as the original `backend/` layout.
    """
    override = os.environ.get("ZOOM_CLONE_DB_PATH")
    if override:
        return Path(override)
    if os.environ.get("VERCEL") == "1":
        return Path("/tmp/zoom_clone.db")
    return Path(__file__).resolve().parent.parent / "zoom_clone.db"


DB_PATH = _resolve_db_path()
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
