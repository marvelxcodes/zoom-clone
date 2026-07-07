from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


def utcnow() -> datetime:
    # Naive UTC to match SQLite's default storage — comparisons stay consistent.
    return datetime.utcnow()


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    avatar_color: str = "#2D8CFF"
    created_at: datetime = Field(default_factory=utcnow)


class Meeting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: str = Field(index=True, unique=True)
    host_id: int = Field(foreign_key="user.id")
    title: str = "My Meeting"
    description: str = ""
    passcode: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    duration_minutes: int = 60
    status: str = "scheduled"  # scheduled | active | ended
    is_instant: bool = False
    created_at: datetime = Field(default_factory=utcnow)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class Participant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: str = Field(index=True)
    display_name: str
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    is_host: bool = False
    is_muted: bool = False
    is_video_on: bool = False
    is_hand_raised: bool = False
    joined_at: datetime = Field(default_factory=utcnow)
    left_at: Optional[datetime] = None
    removed: bool = False
