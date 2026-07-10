import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv


def parse_args():
    parser = argparse.ArgumentParser(description="Download NFL spread odds from The Odds API.")
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    return parser.parse_args()


def main():
    args = parse_args()
    load_dotenv()

    api_key = os.getenv("ODDS_API_KEY")
    if not api_key:
        raise ValueError("ODDS_API_KEY is missing from .env")

    url = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds"

    params = {
        "apiKey": api_key,
        "regions": "us",
        "markets": "spreads",
        "oddsFormat": "american",
        "dateFormat": "iso",
    }

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    output_dir = Path(f"../Input/odds_api/{args.season}/week_{args.week:02d}")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"odds_snapshot_{timestamp}.json"

    output_file.write_text(json.dumps(data, indent=2))

    print(f"Saved odds snapshot: {output_file}")
    print(f"Events returned: {len(data)}")
    print(f"Requests remaining: {response.headers.get('x-requests-remaining')}")
    print(f"Requests used: {response.headers.get('x-requests-used')}")


if __name__ == "__main__":
    main()
