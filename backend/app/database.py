from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine

DB_PATH = Path(__file__).resolve().parent.parent / "zoom_clone.db"
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
