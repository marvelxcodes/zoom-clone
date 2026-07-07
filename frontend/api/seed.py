"""Seed the SQLite database with sample users, meetings, and participants.

- CLI (`python -m api.seed`)    → drops the DB file and re-seeds from scratch.
- `seed_if_empty()`             → invoked on Vercel cold starts. Only seeds
                                  when there are zero users, so it's a no-op
                                  on warm instances.
"""

from datetime import timedelta

from sqlmodel import Session, delete, select

from .database import DB_PATH, engine, init_db
from .models import Meeting, Participant, User, utcnow
from .utils import new_meeting_id, new_passcode

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


def _populate(session: Session) -> None:
    now = utcnow()

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
        session.add(
            Meeting(
                meeting_id=new_meeting_id(),
                host_id=host.id,
                title=title,
                description=desc,
                passcode=new_passcode(),
                scheduled_start=now + delta,
                duration_minutes=duration,
                status="scheduled",
            )
        )

    for title, desc, delta in RECENT_MEETINGS:
        started = now + delta
        ended = started + timedelta(minutes=45)
        session.add(
            Meeting(
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
        )

    session.commit()


def reset_and_seed() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
    init_db()
    with Session(engine) as session:
        session.exec(delete(Participant))
        session.exec(delete(Meeting))
        session.exec(delete(User))
        session.commit()
        _populate(session)
    print(f"Seeded database at {DB_PATH}")


def seed_if_empty() -> None:
    """Populate the DB only if it has no users. Safe to call on every start."""
    init_db()
    with Session(engine) as session:
        if session.exec(select(User).limit(1)).first() is not None:
            return
        _populate(session)


if __name__ == "__main__":
    reset_and_seed()
