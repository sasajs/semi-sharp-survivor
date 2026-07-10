import argparse
import json
import math
from functools import lru_cache

from app.db import get_connection


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    return parser.parse_args()


def spread_to_win_probability(spread):
    strength = abs(float(spread))
    return 1.0 / (1.0 + math.exp(-(strength / 6.75)))


def main():
    args = parse_args()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT entry_id, survivor_sweat_name
                FROM survivor.entries
                WHERE is_active = TRUE
                ORDER BY entry_id;
            """)
            entries = cur.fetchall()

            cur.execute("""
                SELECT
                    l.leg_number,
                    l.leg_code,
                    l.leg_name,
                    l.nfl_week,
                    l.special_leg_type
                FROM contest.legs l
                JOIN contest.formats f ON f.contest_format_id = l.contest_format_id
                WHERE l.season = %s
                  AND f.format_code = %s
                ORDER BY l.leg_number;
            """, (args.season, args.contest_format))
            leg_cols = [d[0] for d in cur.description]
            legs = [dict(zip(leg_cols, r)) for r in cur.fetchall()]

            candidates_by_leg = {}

            for leg in legs:
                if leg["special_leg_type"] == "THANKSGIVING":
                    filter_sql = "g.is_thanksgiving = TRUE"
                    params = [args.season]
                elif leg["special_leg_type"] == "CHRISTMAS":
                    filter_sql = "g.is_christmas = TRUE"
                    params = [args.season]
                else:
                    filter_sql = "g.week = %s"
                    params = [args.season, leg["nfl_week"]]
                    if args.contest_format == "CIRCA":
                        filter_sql += " AND g.is_thanksgiving = FALSE AND g.is_christmas = FALSE"

                cur.execute(f"""
                    SELECT
                        p.game_id,
                        p.projected_favorite_team_id AS team_id,
                        p.projected_favorite_abbr AS team,
                        p.projected_spread,
                        CASE
                            WHEN r.game_id IS NULL THEN 0
                            ELSE r.total_risk_points
                        END AS risk_points,
                        CASE
                            WHEN r.game_id IS NULL THEN 'NOT_CALCULATED'
                            ELSE r.risk_types
                        END AS risk_types
                    FROM projections.game_spreads p
                    JOIN schedule.games g ON g.game_id = p.game_id
                    LEFT JOIN risk.game_risk_summary r
                      ON r.game_id = p.game_id
                     AND r.team_id = p.projected_favorite_team_id
                    WHERE p.season = %s
                      AND p.source_system = 'SEMISHARP_PROJECTION_V2'
                      AND {filter_sql}
                    ORDER BY ABS(p.projected_spread) DESC LIMIT 3;
                """, params)

                cols = [d[0] for d in cur.description]
                rows = [dict(zip(cols, r)) for r in cur.fetchall()]

                candidates = []
                for row in rows:
                    win_prob = spread_to_win_probability(row["projected_spread"])
                    risk_penalty = float(row["risk_points"]) * 0.015
                    adjusted_prob = max(0.01, min(0.99, win_prob - risk_penalty))

                    candidates.append({
                        **row,
                        "win_probability": win_prob,
                        "adjusted_probability": adjusted_prob
                    })

                candidates_by_leg[leg["leg_number"]] = candidates

            output = {
                "strategy": "DYNAMIC_PROGRAMMING_OPTIMIZATION",
                "strategy_version": "v1",
                "season": args.season,
                "contest_format": args.contest_format,
                "method": "Backward dynamic programming using risk-adjusted win probability and one-use team constraint.",
                "entries": []
            }

            for entry_id, sweat_name in entries:
                cur.execute("""
                    SELECT team_id
                    FROM survivor.entry_picks
                    WHERE entry_id = %s;
                """, (entry_id,))
                already_used = frozenset(r[0] for r in cur.fetchall())

                leg_numbers = [leg["leg_number"] for leg in legs]
                leg_by_number = {leg["leg_number"]: leg for leg in legs}

                @lru_cache(maxsize=None)
                def best_path(idx, used_tuple):
                    used = set(used_tuple)

                    if idx >= len(leg_numbers):
                        return 1.0, []

                    leg_number = leg_numbers[idx]
                    candidates = candidates_by_leg.get(leg_number, [])

                    best_score = -1.0
                    best_choices = []

                    for c in candidates:
                        if c["team_id"] in used:
                            continue

                        next_used = tuple(sorted(used | {c["team_id"]}))
                        future_score, future_choices = best_path(idx + 1, next_used)

                        total_score = c["adjusted_probability"] * future_score

                        if total_score > best_score:
                            best_score = total_score
                            best_choices = [c] + future_choices

                    if best_score < 0:
                        return 0.0, []

                    return best_score, best_choices

                total_survival, chosen_path = best_path(0, tuple(sorted(already_used)))

                picks = []
                for leg_number, chosen in zip(leg_numbers, chosen_path):
                    leg = leg_by_number[leg_number]

                    picks.append({
                        "leg_number": leg["leg_number"],
                        "leg_code": leg["leg_code"],
                        "leg_name": leg["leg_name"],
                        "team": chosen["team"],
                        "game_id": chosen["game_id"],
                        "projected_line": f"{chosen['team']} {round(float(chosen['projected_spread']), 1)}",
                        "win_probability": round(chosen["win_probability"], 3),
                        "risk_points": round(float(chosen["risk_points"]), 2),
                        "risk_types": chosen["risk_types"],
                        "adjusted_probability": round(chosen["adjusted_probability"], 3),
                        "rationale": "Selected by dynamic programming to maximize full-path survival probability."
                    })

                output["entries"].append({
                    "entry_id": entry_id,
                    "survivor_sweat_name": sweat_name,
                    "estimated_path_survival_probability": round(total_survival, 5),
                    "picks": picks
                })

    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
