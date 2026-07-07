"""Seed the SQLite database with sample users, meetings, and participants."""

from datetime import datetime, timedelta
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlmodel import Session, delete

from app.database import DB_PATH, engine, init_db
from app.models import Meeting, Participant, User, utcnow
from app.utils import new_meeting_id, new_passcode


SAMPLE_USERS = [
    ("Alex Chen", "alex@example.com", "#2D8CFF"),
    ("Priya Patel", "priya@example.com", "#F5A623"),
    ("Diego Rossi", "diego@example.com", "#8B5CF6"),
    ("Mei Tanaka", "mei@example.com", "#10B981"),
    ("Jordan Reid", "jordan@example.com", "#EF4444"),
]

UPCOMING_MEETINGS = [
    ("Team standup", "Weekly sync", timedelta(hours=2), 30),
    ("Design review", "Q3 design walkthrough", timedelta(days=1, hours=3), 60),
    ("1:1 with Priya", "Career check-in", timedelta(days=2), 45),
    ("Product roadmap", "Planning session for next quarter", timedelta(days=5), 90),
]

RECENT_MEETINGS = [
    ("All-hands", "Company update", timedelta(days=-1)),
    ("Sprint retro", "Retrospective for sprint 42", timedelta(days=-3)),
    ("Customer call — Acme", "Renewal discussion", timedelta(days=-6)),
]


def reset_and_seed() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
    init_db()

    now = utcnow()

    with Session(engine) as session:
        session.exec(delete(Participant))
        session.exec(delete(Meeting))
        session.exec(delete(User))

        users: list[User] = []
        for name, email, color in SAMPLE_USERS:
            u = User(name=name, email=email, avatar_color=color)
            session.add(u)
            users.append(u)
        session.commit()
        for u in users:
            session.refresh(u)

        host = users[0]

        for title, desc, delta, duration in UPCOMING_MEETINGS:
            m = Meeting(
                meeting_id=new_meeting_id(),
                host_id=host.id,
                title=title,
                description=desc,
                passcode=new_passcode(),
                scheduled_start=now + delta,
                duration_minutes=duration,
                status="scheduled",
            )
            session.add(m)

        for title, desc, delta in RECENT_MEETINGS:
            started = now + delta
            ended = started + timedelta(minutes=45)
            m = Meeting(
                meeting_id=new_meeting_id(),
                host_id=host.id,
                title=title,
                description=desc,
                scheduled_start=started,
                duration_minutes=45,
                status="ended",
                started_at=started,
                ended_at=ended,
                is_instant=False,
            )
            session.add(m)

        session.commit()

    print(f"Seeded database at {DB_PATH}")


if __name__ == "__main__":
    reset_and_seed()
