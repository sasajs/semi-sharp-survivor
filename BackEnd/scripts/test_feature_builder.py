import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1])
)

from app.features.builder import preview_features


rows = preview_features(
    2026,
    1
)

print(f"Rows returned: {len(rows)}")

for row in rows[:5]:
    print(row)
