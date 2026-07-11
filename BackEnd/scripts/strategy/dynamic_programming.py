#!/usr/bin/env python3
import argparse
import json
import math
import sys
from functools import lru_cache
from app.db import get_connection

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    # Added required arguments to prevent exit status 2
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()

def spread_to_win_probability(spread):
    strength = abs(float(spread))
    return 1.0 / (1.0 + math.exp(-(strength / 6.75)))

def main():
    args = parse_args()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT entry_id, survivor_sweat_name FROM survivor.entries WHERE is_active = TRUE ORDER BY entry_id;")
            entries = cur.fetchall()

            cur.execute("""
                SELECT l.leg_number, l.leg_code, l.leg_name, l.nfl_week, l.special_leg_type
                FROM contest.legs l JOIN contest.formats f ON f.contest_format_id = l.contest_format_id
                WHERE l.season = %s AND f.format_code = %s ORDER BY l.leg_number;
            """, (args.season, args.contest_format))
            leg_cols = [d[0] for d in cur.description]
            legs = [dict(zip(leg_cols, r)) for r in cur.fetchall()]

            candidates_by_leg = {}
            for leg in legs:
                filter_sql = "g.is_thanksgiving = TRUE" if leg["special_leg_type"] == "THANKSGIVING" else \
                             "g.is_christmas = TRUE" if leg["special_leg_type"] == "CHRISTMAS" else \
                             "g.week = %s"
                params = [args.season] if leg["special_leg_type"] in ("THANKSGIVING", "CHRISTMAS") else [args.season, leg["nfl_week"]]
                
                cur.execute(f"""
                    SELECT p.game_id, p.projected_favorite_team_id AS team_id, p.projected_favorite_abbr AS team, p.projected_spread,
                    COALESCE(r.total_risk_points, 0) AS risk_points, COALESCE(r.risk_types, 'NOT_CALCULATED') AS risk_types
                    FROM projections.game_spreads p JOIN schedule.games g ON g.game_id = p.game_id
                    LEFT JOIN risk.game_risk_summary r ON r.game_id = p.game_id AND r.team_id = p.projected_favorite_team_id
                    WHERE p.season = %s AND p.source_system = 'SEMISHARP_PROJECTION_V2' AND {filter_sql}
                    ORDER BY ABS(p.projected_spread) DESC LIMIT 3;
                """, params)
                cols = [d[0] for d in cur.description]
                rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                candidates = []
                for row in rows:
                    win_prob = spread_to_win_probability(row["projected_spread"])
                    risk_penalty = float(row["risk_points"]) * 0.015
                    adjusted_prob = max(0.01, min(0.99, win_prob - risk_penalty))
                    candidates.append({**row, "win_probability": win_prob, "adjusted_probability": adjusted_prob})
                candidates_by_leg[leg["leg_number"]] = candidates

            output = {"strategy": "DYNAMIC_PROGRAMMING_OPTIMIZATION", "strategy_version": "v1", "entries": []}
            for entry_id, sweat_name in entries:
                cur.execute("SELECT team_id FROM survivor.entry_picks WHERE entry_id = %s;", (entry_id,))
                already_used = frozenset(r[0] for r in cur.fetchall())
                leg_numbers = [leg["leg_number"] for leg in legs]

                @lru_cache(maxsize=None)
                def best_path(idx, used_tuple):
                    if idx >= len(leg_numbers): return 1.0, []
                    best_score, best_choices = -1.0, []
                    for c in candidates_by_leg.get(leg_numbers[idx], []):
                        if c["team_id"] in set(used_tuple): continue
                        future_score, future_choices = best_path(idx + 1, tuple(sorted(set(used_tuple) | {c["team_id"]})))
                        total = c["adjusted_probability"] * future_score
                        if total > best_score: best_score, best_choices = total, [c] + future_choices
                    return best_score, best_choices

                _, chosen_path = best_path(0, tuple(sorted(already_used)))
                picks = []
                for leg, chosen in zip(legs, chosen_path):
                    picks.append({**leg, "team": chosen["team"], "rationale": "DP Optimization"})
                output["entries"].append({"entry_id": entry_id, "survivor_sweat_name": sweat_name, "picks": picks})
            print(json.dumps(output, indent=2, default=str))

if __name__ == "__main__":
    main()
