import argparse
import json
import math
from app.db import get_connection

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)

    parser.add_argument(
        "--rating-week",
        required=False,
        default=None
    )

    parser.add_argument(
        "--hfa-source",
        required=False,
        default=None
    )

    return parser.parse_args()

def spread_to_win_probability(spread):
    strength = abs(float(spread))
    # Simple normal approximation. NFL margin std dev roughly 13.5 points.
    return 1.0 / (1.0 + math.exp(-(strength / 6.75)))


def get_candidates(cur, args, leg):
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
            ABS(p.projected_spread) AS spread_strength,
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
        ORDER BY ABS(p.projected_spread) DESC;
    """, params)

    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def main():
    args = parse_args()

    output = {
        "strategy": "MONTE_CARLO_SURVIVOR",
        "strategy_version": "v1",
        "season": args.season,
        "contest_format": args.contest_format,
        "method": "Greedy expected survival approximation using projected spread win probability minus risk penalty.",
        "entries": []
    }

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
                    l.contest_leg_id,
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

            cols = [d[0] for d in cur.description]
            legs = [dict(zip(cols, row)) for row in cur.fetchall()]

            if args.contest_format == "CIRCA":
                special = [l for l in legs if l["special_leg_type"] in ("THANKSGIVING", "CHRISTMAS")]
                normal = [l for l in legs if l["special_leg_type"] is None]
                processing_order = special + normal
            else:
                processing_order = legs

            for entry_id, sweat_name in entries:
                cur.execute("SELECT team_id FROM survivor.entry_picks WHERE entry_id = %s;", (entry_id,))
                used = {r[0] for r in cur.fetchall()}

                picks = []
                survival_probability = 1.0

                for leg in processing_order:
                    best = None
                    best_score = -999

                    for c in get_candidates(cur, args, leg):
                        if c["team_id"] in used:
                            continue

                        win_prob = spread_to_win_probability(c["projected_spread"])
                        risk_penalty = float(c["risk_points"]) * 0.015
                        adjusted_prob = max(0.01, min(0.99, win_prob - risk_penalty))

                        if adjusted_prob > best_score:
                            best_score = adjusted_prob
                            best = {
                                **c,
                                "win_probability": win_prob,
                                "adjusted_probability": adjusted_prob
                            }

                    if best is None:
                        continue

                    used.add(best["team_id"])
                    survival_probability *= best["adjusted_probability"]

                    picks.append({
                        "leg_number": leg["leg_number"],
                        "leg_code": leg["leg_code"],
                        "leg_name": leg["leg_name"],
                        "team": best["team"],
                        "game_id": best["game_id"],
                        "projected_line": f"{best['team']} {round(float(best['projected_spread']), 1)}",
                        "win_probability": round(best["win_probability"], 3),
                        "risk_points": round(float(best["risk_points"]), 2),
                        "risk_types": best["risk_types"],
                        "adjusted_probability": round(best["adjusted_probability"], 3),
                        "rationale": "Selected highest risk-adjusted estimated survival probability."
                    })

                picks.sort(key=lambda x: x["leg_number"])

                output["entries"].append({
                    "entry_id": entry_id,
                    "survivor_sweat_name": sweat_name,
                    "estimated_path_survival_probability": round(survival_probability, 5),
                    "picks": picks
                })

    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
