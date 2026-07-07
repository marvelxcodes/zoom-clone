import os
import random
import string

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


def new_meeting_id() -> str:
    """Return a Zoom-style 10-11 digit numeric meeting id."""
    return "".join(random.choices(string.digits, k=11))


def new_passcode() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


def build_join_url(meeting_id: str) -> str:
    return f"{FRONTEND_URL}/wc/{meeting_id}/start"


def build_invite_url(meeting_id: str, passcode: str | None = None) -> str:
    url = f"{FRONTEND_URL}/wc/join?meetingId={meeting_id}"
    if passcode:
        url += f"&pwd={passcode}"
    return url
