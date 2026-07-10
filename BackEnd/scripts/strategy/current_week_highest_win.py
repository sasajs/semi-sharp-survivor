#!/usr/bin/env python3
import argparse
import json
import sys
from app.db import get_connection


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()


def get_candidates_with_v3_risk(cur, args, leg):
    """
    Fetches candidate favorites for a contest leg joined with historically
    calibrated V3 risk metrics to perform risk-adjusted sorting.
    """
    if leg["special_leg_type"] == "THANKSGIVING":
        filter_sql = "g.is_thanksgiving = TRUE"
        params = [args.season, args.rating_week, args.hfa_source]
    elif leg["special_leg_type"] == "CHRISTMAS":
        filter_sql = "g.is_christmas = TRUE"
        params = [args.season, args.rating_week, args.hfa_source]
    else:
        filter_sql = "g.week = %s"
        params = [args.season, args.rating_week, args.hfa_source, leg["nfl_week"]]
        if args.contest_format == "CIRCA":
            filter_sql += " AND g.is_thanksgiving = FALSE AND g.is_christmas = FALSE"

    cur.execute(f"""
        SELECT
            p.game_id,
            p.projected_favorite_team_id AS team_id,
            p.projected_favorite_abbr,
            p.projected_spread,
            ABS(p.projected_spread) AS spread_strength,
            COALESCE(r.risk_score, 0.0) AS risk_score,
            COALESCE(r.risk_stars, 1) AS risk_stars,
            COALESCE(r.risk_level, 'LOW') AS risk_level,
            COALESCE(r.risk_summary, 'No significant risk factors detected.') AS risk_summary,
            -- Risk-adjusted sort logic: smaller spreads are penalized; high risk scores increase the value,
            -- dragging the negative spread closer to 0 (making it less attractive).
            (p.projected_spread + (COALESCE(r.risk_score, 0.0) * 0.1)) AS risk_adjusted_spread
        FROM projections.game_spreads p
        JOIN schedule.games g ON g.game_id = p.game_id
        LEFT JOIN risk.game_risk_scores r ON r.game_id = p.game_id AND r.team_id = p.projected_favorite_team_id
        WHERE p.season = %s
          AND p.rating_week = %s
          AND p.hfa_source_system = %s
          AND {filter_sql}
        ORDER BY ABS(p.projected_spread + (COALESCE(r.risk_score, 0.0) * 0.1)) DESC;
    """, params)

    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def get_current_application_context(cur):
    """Retrieves the system's operational live week threshold."""
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
        "strategy": "CURRENT_WEEK_HIGHEST_WIN",
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
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

            # Enforce Circa Rules: Process holiday nodes first to lock top options
            if args.contest_format == "CIRCA":
                special = [l for l in legs if l["special_leg_type"] in ("THANKSGIVING", "CHRISTMAS")]
                normal = [l for l in legs if l["special_leg_type"] is None]
                processing_order = special + normal
            else:
                processing_order = legs

            for entry_id, sweat_name in entries:
                cur.execute("""
                    SELECT team_id
                    FROM survivor.entry_picks
                    WHERE entry_id = %s;
                """, (entry_id,))
                used = {r[0] for r in cur.fetchall()}

                picks = []
                current_week_alternatives = None

                for leg in processing_order:
                    candidates = get_candidates_with_v3_risk(cur, args, leg)

                    chosen = None
                    valid_idx = -1
                    for idx, c in enumerate(candidates):
                        if c["team_id"] not in used:
                            chosen = c
                            valid_idx = idx
                            break

                    if chosen:
                        used.add(chosen["team_id"])
                        
                        pick_node = {
                            "leg_number": leg["leg_number"],
                            "leg_code": leg["leg_code"],
                            "leg_name": leg["leg_name"],
                            "team": chosen["projected_favorite_abbr"],
                            "projected_line": f"{chosen['projected_favorite_abbr']} {round(chosen['projected_spread'], 1)}",
                            "game_id": chosen["game_id"],
                            "risk_stars": chosen["risk_stars"],
                            "risk_level": chosen["risk_level"],
                            "risk_points": float(chosen["risk_score"]),
                            "risk_summary": chosen["risk_summary"]
                        }
                        picks.append(pick_node)

                        # Generate alternative option exclusively for the active week context
                        if leg["nfl_week"] == current_active_week and leg["special_leg_type"] is None:
                            alt_options = []
                            for alt_c in candidates[valid_idx + 1:]:
                                if alt_c["team_id"] not in used and alt_c["game_id"] != chosen["game_id"]:
                                    alt_options.append({
                                        "team": alt_c["projected_favorite_abbr"],
                                        "projected_line": f"{alt_c['projected_favorite_abbr']} {round(alt_c['projected_spread'], 1)}",
                                        "game_id": alt_c["game_id"],
                                        "risk_stars": alt_c["risk_stars"],
                                        "risk_level": alt_c["risk_level"],
                                        "risk_points": float(alt_c["risk_score"]),
                                        "risk_summary": alt_c["risk_summary"]
                                    })
                                    if len(alt_options) >= 2:  # Retain up to two safe fallbacks
                                        break
                            current_week_alternatives = alt_options

                picks.sort(key=lambda x: x["leg_number"])

                output["entries"].append({
                    "entry_id": entry_id,
                    "survivor_sweat_name": sweat_name,
                    "alternative_recommendations": current_week_alternatives or [],
                    "picks": picks
                })

    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
