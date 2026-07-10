import argparse
import json
import subprocess
from collections import defaultdict


STRATEGIES = {
    "highest_win_probability": [
        "scripts/strategy/highest_win_probability.py"
    ],
    "future_value": [
        "scripts/strategy/future_value.py"
    ],
    "multiple_entry_portfolio": [
        "scripts/strategy/multiple_entry_portfolio.py"
    ],
    "projection_edge": [
        "scripts/strategy/projection_edge.py"
    ],
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()


def run_strategy(name, script, args):
    cmd = [
        "python3",
        script,
        "--season", str(args.season),
        "--contest-format", args.contest_format,
    ]

    if name != "projection_edge":
        cmd += [
            "--rating-week", str(args.rating_week),
            "--hfa-source", args.hfa_source,
        ]

    result = subprocess.run(
        cmd,
        check=True,
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "."}
    )

    return json.loads(result.stdout)


def main():
    args = parse_args()
    raw_results = {}

    for name, script_list in STRATEGIES.items():
        raw_results[name] = run_strategy(name, script_list[0], args)

    comparison = defaultdict(lambda: defaultdict(dict))

    for strategy_name, result in raw_results.items():
        for entry in result["entries"]:
            entry_name = entry["survivor_sweat_name"]

            for pick in entry["picks"]:
                leg = pick["leg_code"]
                comparison[entry_name][leg][strategy_name] = pick["team"]

    output = {
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "comparison": []
    }

    for entry_name, legs in comparison.items():
        entry_result = {
            "survivor_sweat_name": entry_name,
            "legs": []
        }

        for leg_code, picks in sorted(legs.items()):
            pick_counts = defaultdict(int)

            for team in picks.values():
                pick_counts[team] += 1

            consensus_team = max(pick_counts.items(), key=lambda x: x[1])[0]
            agreement_count = pick_counts[consensus_team]

            entry_result["legs"].append({
                "leg_code": leg_code,
                "strategy_picks": picks,
                "consensus_team": consensus_team,
                "agreement_count": agreement_count,
                "strategy_count": len(picks)
            })

        output["comparison"].append(entry_result)

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
