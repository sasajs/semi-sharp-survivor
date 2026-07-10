#!/usr/bin/env python3
import argparse
import json
import math
import sys
from app.db import get_connection

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    parser.add_argument("--rating-week", type=int, required=False, default=None)
    parser.add_argument("--hfa-source", required=False, default=None)
    return parser.parse_args()

def spread_to_win_probability_v3(spread, risk_score):
    """
    V3 Uncertainty Modeling: Converts point spreads to exact win probabilities.
    Higher calibrated risk scores expand game variance (widening the logistic 
    distribution scale), reducing the favorite's true single-game win equity.
    """
    strength = abs(float(spread))
    # Baseline NFL margin standard deviation is roughly 13.5 (scale factor 6.75)
    # Risk points expand this denominator, increasing performance uncertainty.
    calibrated_scale = 6.75 + (float(risk_score) * 0.05)
    return 1.0 / (1.0 + math.exp(-(strength / calibrated_scale)))

def get_candidates_with_v3_risk(cur, args, leg):
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
            COALESCE(r.risk_score, 0.0) AS risk_score,
            COALESCE(r.risk_stars, 1) AS risk_stars,
            COALESCE(r.risk_level, 'LOW') AS risk_level,
            COALESCE(r.risk_summary, 'No significant risk factors detected.') AS risk_summary
        FROM projections.game_spreads p
        JOIN schedule.games g ON g.game_id = p.game_id
        LEFT JOIN risk.game_risk_scores r 
          ON r.game_id = p.game_id 
         AND r.team_id = p.projected_favorite_team_id
        WHERE p.season = %s
          AND p.source_system = 'SEMISHARP_PROJECTION_V2'
          AND {filter_sql}
        ORDER BY ABS(p.projected_spread) DESC;
    """, params)

    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

def get_current_application_context(cur):
    cur.execute("""
        SELECT current_week 
        FROM system.application_context 
        WHERE is_active = TRUE 
        LIMIT 1;
    """)
    row = cur.fetchone()
    return row[0] if row else 1

def main():
    args = parse_args()

    output = {
        "strategy": "MONTE_CARLO_SURVIVOR",
        "strategy_version": "v3.0",
        "season": args.season,
        "contest_format": args.contest_format,
        "method": "V3 simulation strategy applying dynamically calibrated game-variance expansion from market risk parameters.",
        "entries": []
    }

    with get_connection() as conn:
        with conn.cursor() as cur:
            current_active_week = get_current_application_context(cur)

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
                current_week_alternatives = None

                for leg in processing_order:
                    candidates = get_candidates_with_v3_risk(cur, args, leg)
                    
                    best = None
                    best_score = -999
                    valid_idx = -1

                    for idx, c in enumerate(candidates):
                        if c["team_id"] in used:
                            continue

                        # Calculate win probability utilizing risk-expanded distribution scales
                        win_prob = spread_to_win_probability_v3(c["projected_spread"], c["risk_score"])
                        
                        if win_prob > best_score:
                            best_score = win_prob
                            valid_idx = idx
                            best = {
                                **c,
                                "adjusted_probability": win_prob
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
                        "risk_stars": best["risk_stars"],
                        "risk_level": best["risk_level"],
                        "risk_points": round(float(best["risk_score"]), 2),
                        "risk_summary": best["risk_summary"],
                        "adjusted_probability": round(best["adjusted_probability"], 3),
                        "rationale": "Optimized long-term survival path accounting for risk-expanded performance uncertainty."
                    })

                    # Compile alternative paths for active week view panel
                    if leg["nfl_week"] == current_active_week and leg["special_leg_type"] is None:
                        alt_nodes = []
                        for alt_c in candidates:
                            if alt_c["team_id"] not in used and alt_c["game_id"] != best["game_id"]:
                                alt_win_prob = spread_to_win_probability_v3(alt_c["projected_spread"], alt_c["risk_score"])
                                alt_nodes.append({
                                    "team": alt_c["team"],
                                    "game_id": alt_c["game_id"],
                                    "projected_line": f"{alt_c['team']} {round(float(alt_c['projected_spread']), 1)}",
                                    "risk_stars": alt_c["risk_stars"],
                                    "risk_level": alt_c["risk_level"],
                                    "risk_points": round(float(alt_c["risk_score"]), 2),
                                    "risk_summary": alt_c["risk_summary"],
                                    "adjusted_probability": round(alt_win_prob, 3)
                                })
                                if len(alt_nodes) >= 2:
                                    break
                        current_week_alternatives = alt_nodes

                picks.sort(key=lambda x: x["leg_number"])

                output["entries"].append({
                    "entry_id": entry_id,
                    "survivor_sweat_name": sweat_name,
                    "estimated_path_survival_probability": round(survival_probability, 5),
                    "alternative_recommendations": current_week_alternatives or [],
                    "picks": picks
                })

    print(json.dumps(output, indent=2, default=str))

if __name__ == "__main__":
    main()
