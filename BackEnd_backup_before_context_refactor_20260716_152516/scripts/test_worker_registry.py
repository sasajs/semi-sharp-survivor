import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1])
)

from app.jobs.registry import JOB_HANDLERS


print("Registered jobs:")

for job in JOB_HANDLERS:
    print("-", job)
