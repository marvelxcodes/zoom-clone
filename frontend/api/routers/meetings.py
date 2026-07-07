from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Meeting, User, utcnow
from ..schemas import (
    InstantMeetingIn,
    JoinMeetingIn,
    MeetingOut,
    MessageOut,
    ScheduleMeetingIn,
)
from ..utils import build_invite_url, build_join_url, new_meeting_id, new_passcode

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _default_user(session: Session) -> User:
    user = session.exec(select(User).order_by(User.id)).first()
    if user is None:
        user = User(name="Alex Chen", email="alex@example.com", avatar_color="#2D8CFF")
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


def _to_out(meeting: Meeting, host_name: Optional[str] = None) -> MeetingOut:
    return MeetingOut(
        id=meeting.id or 0,
        meeting_id=meeting.meeting_id,
        host_id=meeting.host_id,
        host_name=host_name,
        title=meeting.title,
        description=meeting.description,
        passcode=meeting.passcode,
        scheduled_start=meeting.scheduled_start,
        duration_minutes=meeting.duration_minutes,
        status=meeting.status,
        is_instant=meeting.is_instant,
        created_at=meeting.created_at,
        started_at=meeting.started_at,
        ended_at=meeting.ended_at,
        invite_url=build_invite_url(meeting.meeting_id, meeting.passcode),
        join_url=build_join_url(meeting.meeting_id),
    )


def _attach_host(session: Session, meeting: Meeting) -> MeetingOut:
    host = session.get(User, meeting.host_id)
    return _to_out(meeting, host.name if host else None)


@router.get("/upcoming", response_model=List[MeetingOut])
def list_upcoming(session: Session = Depends(get_session)):
    now = utcnow()
    stmt = (
        select(Meeting)
        .where(Meeting.status == "scheduled")
        .where(Meeting.scheduled_start != None)  # noqa: E711
        .order_by(Meeting.scheduled_start)
    )
    meetings = [m for m in session.exec(stmt).all() if m.scheduled_start and m.scheduled_start >= now]
    return [_attach_host(session, m) for m in meetings]


@router.get("/recent", response_model=List[MeetingOut])
def list_recent(session: Session = Depends(get_session)):
    stmt = (
        select(Meeting)
        .where(Meeting.status == "ended")
        .order_by(Meeting.ended_at.desc())
        .limit(15)
    )
    meetings = session.exec(stmt).all()
    return [_attach_host(session, m) for m in meetings]


@router.post("/instant", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_instant(
    payload: InstantMeetingIn,
    session: Session = Depends(get_session),
):
    host = _default_user(session)
    meeting = Meeting(
        meeting_id=new_meeting_id(),
        host_id=host.id,  # type: ignore[arg-type]
        title=payload.title or f"{host.name}'s Zoom Meeting",
        is_instant=True,
        status="active",
        started_at=utcnow(),
    )
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return _to_out(meeting, host.name)


@router.post("/schedule", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    payload: ScheduleMeetingIn,
    session: Session = Depends(get_session),
):
    host = _default_user(session)
    meeting = Meeting(
        meeting_id=new_meeting_id(),
        host_id=host.id,  # type: ignore[arg-type]
        title=payload.title,
        description=payload.description,
        passcode=payload.passcode or new_passcode(),
        scheduled_start=payload.scheduled_start,
        duration_minutes=payload.duration_minutes,
        status="scheduled",
        is_instant=False,
    )
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return _to_out(meeting, host.name)


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: str, session: Session = Depends(get_session)):
    meeting = session.exec(
        select(Meeting).where(Meeting.meeting_id == meeting_id)
    ).first()
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return _attach_host(session, meeting)


@router.post("/{meeting_id}/validate", response_model=MessageOut)
def validate_meeting(
    meeting_id: str,
    payload: JoinMeetingIn,
    session: Session = Depends(get_session),
):
    meeting = session.exec(
        select(Meeting).where(Meeting.meeting_id == meeting_id)
    ).first()
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.passcode and payload.passcode != meeting.passcode:
        raise HTTPException(status_code=403, detail="Invalid passcode")
    return MessageOut(ok=True, message="ok")


@router.post("/{meeting_id}/start", response_model=MeetingOut)
def start_meeting(meeting_id: str, session: Session = Depends(get_session)):
    meeting = session.exec(
        select(Meeting).where(Meeting.meeting_id == meeting_id)
    ).first()
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status == "ended":
        raise HTTPException(status_code=400, detail="Meeting has ended")
    if meeting.status != "active":
        meeting.status = "active"
        meeting.started_at = utcnow()
        session.add(meeting)
        session.commit()
        session.refresh(meeting)
    return _attach_host(session, meeting)


@router.post("/{meeting_id}/end", response_model=MeetingOut)
def end_meeting(meeting_id: str, session: Session = Depends(get_session)):
    meeting = session.exec(
        select(Meeting).where(Meeting.meeting_id == meeting_id)
    ).first()
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting.status = "ended"
    meeting.ended_at = utcnow()
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return _attach_host(session, meeting)


@router.get("/", response_model=List[MeetingOut])
def list_all(session: Session = Depends(get_session)):
    meetings = session.exec(select(Meeting).order_by(Meeting.created_at.desc())).all()
    return [_attach_host(session, m) for m in meetings]
