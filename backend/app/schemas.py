from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_color: str

    class Config:
        from_attributes = True


class MeetingBase(BaseModel):
    title: str = "My Meeting"
    description: str = ""
    passcode: Optional[str] = None


class ScheduleMeetingIn(MeetingBase):
    scheduled_start: datetime
    duration_minutes: int = 60


class InstantMeetingIn(BaseModel):
    title: Optional[str] = None


class MeetingOut(BaseModel):
    id: int
    meeting_id: str
    host_id: int
    host_name: Optional[str] = None
    title: str
    description: str
    passcode: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    duration_minutes: int
    status: str
    is_instant: bool
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    invite_url: str
    join_url: str

    class Config:
        from_attributes = True


class JoinMeetingIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=64)
    passcode: Optional[str] = None
    video_on: bool = False
    muted: bool = True


class ParticipantOut(BaseModel):
    id: int
    meeting_id: str
    display_name: str
    is_host: bool
    is_muted: bool
    is_video_on: bool
    is_hand_raised: bool
    joined_at: datetime
    removed: bool

    class Config:
        from_attributes = True


class ParticipantUpdate(BaseModel):
    is_muted: Optional[bool] = None
    is_video_on: Optional[bool] = None
    is_hand_raised: Optional[bool] = None


class MessageOut(BaseModel):
    ok: bool = True
    message: str = ""
