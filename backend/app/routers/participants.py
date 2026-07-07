from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Meeting, Participant, utcnow
from ..schemas import (
    JoinMeetingIn,
    MessageOut,
    ParticipantOut,
    ParticipantUpdate,
)

router = APIRouter(prefix="/meetings/{meeting_id}/participants", tags=["participants"])


def _meeting_or_404(session: Session, meeting_id: str) -> Meeting:
    m = session.exec(select(Meeting).where(Meeting.meeting_id == meeting_id)).first()
    if m is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return m


@router.get("", response_model=List[ParticipantOut])
def list_participants(meeting_id: str, session: Session = Depends(get_session)):
    _meeting_or_404(session, meeting_id)
    stmt = (
        select(Participant)
        .where(Participant.meeting_id == meeting_id)
        .where(Participant.left_at == None)  # noqa: E711
        .where(Participant.removed == False)  # noqa: E712
        .order_by(Participant.joined_at)
    )
    return session.exec(stmt).all()


@router.post("", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def join_meeting(
    meeting_id: str,
    payload: JoinMeetingIn,
    session: Session = Depends(get_session),
):
    meeting = _meeting_or_404(session, meeting_id)
    if meeting.passcode and payload.passcode != meeting.passcode:
        raise HTTPException(status_code=403, detail="Invalid passcode")

    is_host_already = session.exec(
        select(Participant)
        .where(Participant.meeting_id == meeting_id)
        .where(Participant.is_host == True)  # noqa: E712
        .where(Participant.left_at == None)  # noqa: E711
    ).first() is not None

    participant = Participant(
        meeting_id=meeting_id,
        display_name=payload.display_name.strip(),
        is_host=not is_host_already,
        is_muted=payload.muted,
        is_video_on=payload.video_on,
    )
    session.add(participant)

    if meeting.status == "scheduled":
        meeting.status = "active"
        meeting.started_at = utcnow()
        session.add(meeting)

    session.commit()
    session.refresh(participant)
    return participant


@router.patch("/{participant_id}", response_model=ParticipantOut)
def update_participant(
    meeting_id: str,
    participant_id: int,
    payload: ParticipantUpdate,
    session: Session = Depends(get_session),
):
    p = session.get(Participant, participant_id)
    if p is None or p.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Participant not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


@router.post("/{participant_id}/leave", response_model=MessageOut)
def leave_meeting(
    meeting_id: str,
    participant_id: int,
    session: Session = Depends(get_session),
):
    p = session.get(Participant, participant_id)
    if p is None or p.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Participant not found")
    p.left_at = utcnow()
    session.add(p)
    session.commit()
    return MessageOut(ok=True, message="Left meeting")


@router.post("/{participant_id}/remove", response_model=MessageOut)
def remove_participant(
    meeting_id: str,
    participant_id: int,
    session: Session = Depends(get_session),
):
    p = session.get(Participant, participant_id)
    if p is None or p.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Participant not found")
    p.removed = True
    p.left_at = utcnow()
    session.add(p)
    session.commit()
    return MessageOut(ok=True, message="Participant removed")


@router.post("/mute-all", response_model=MessageOut)
def mute_all(meeting_id: str, session: Session = Depends(get_session)):
    _meeting_or_404(session, meeting_id)
    stmt = (
        select(Participant)
        .where(Participant.meeting_id == meeting_id)
        .where(Participant.left_at == None)  # noqa: E711
        .where(Participant.removed == False)  # noqa: E712
        .where(Participant.is_host == False)  # noqa: E712
    )
    count = 0
    for p in session.exec(stmt).all():
        if not p.is_muted:
            p.is_muted = True
            session.add(p)
            count += 1
    session.commit()
    return MessageOut(ok=True, message=f"Muted {count} participant(s)")
