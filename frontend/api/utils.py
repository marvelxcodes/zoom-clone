import os
import random
import string
from typing import Optional


def _frontend_url() -> str:
    """Resolve the base URL used inside invite/join links.

    Resolution order:
      1. `FRONTEND_URL`                — explicit override (local dev).
      2. `NEXT_PUBLIC_SITE_URL`        — set on Vercel per-environment.
      3. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel-provided (canonical prod).
      4. `VERCEL_URL`                  — per-deployment URL.
      5. Fallback to `http://localhost:3000`.
    """
    explicit = os.environ.get("FRONTEND_URL")
    if explicit:
        return explicit.rstrip("/")

    site = os.environ.get("NEXT_PUBLIC_SITE_URL")
    if site:
        return site.rstrip("/")

    prod = os.environ.get("VERCEL_PROJECT_PRODUCTION_URL")
    if prod:
        return f"https://{prod}"

    deployment = os.environ.get("VERCEL_URL")
    if deployment:
        return f"https://{deployment}"

    return "http://localhost:3000"


def new_meeting_id() -> str:
    """Return a Zoom-style 10-11 digit numeric meeting id."""
    return "".join(random.choices(string.digits, k=11))


def new_passcode() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


def build_join_url(meeting_id: str) -> str:
    return f"{_frontend_url()}/wc/{meeting_id}/start"


def build_invite_url(meeting_id: str, passcode: Optional[str] = None) -> str:
    url = f"{_frontend_url()}/wc/join?meetingId={meeting_id}"
    if passcode:
        url += f"&pwd={passcode}"
    return url
