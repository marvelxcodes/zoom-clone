"""CLI shim so `python seed.py` still works.

Real logic lives in `app/seed.py` so FastAPI can import it too.
"""

from app.seed import reset_and_seed

if __name__ == "__main__":
    reset_and_seed()
