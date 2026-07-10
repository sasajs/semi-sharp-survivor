#!/usr/bin/env python3
import argparse
import json
import sys
from app.db import get_connection

MIN_EDGE = 0.0


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    return parser.parse_args()


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
            e.game_id,
            e.team_id,
            e.team_abbr,
            e.semisharp_spread,
            e.market_spread,
            e.edge_points,
            e.sportsbook_count,
            COALESCE(r.risk_score, 0.0) AS risk_score,
            COALESCE(r.risk_stars, 1) AS risk_stars,
            COALESCE(r.risk_level, 'LOW') AS risk_level,
            COALESCE(r.risk_summary, 'No significant risk factors detected.') AS risk_summary,
            -- V3 Adjusted Asset Edge Pricing Formula: Edge Points - (Risk Points * 1.5)
            (e.edge_points - (COALESCE(r.risk_score, 0.0) * 1.5)) AS adjusted_score
        FROM market.projection_edges e
        JOIN schedule.games g ON g.game_id = e.game_id
        LEFT JOIN risk.game_risk_scores r 
          ON r.game_id = e.game_id 
         AND r.team_id = e.team_id
        WHERE e.season = %s
          AND {filter_sql}
          AND e.edge_points >= %s
        ORDER BY (e.edge_points - (COALESCE(r.risk_score, 0.0) * 1.5)) DESC, e.edge_points DESC, ABS(e.semisharp_spread) DESC;
    """, params + [MIN_EDGE])

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
        "strategy": "PROJECTION_EDGE",
        "strategy_version": "v3.0",
        "season": args.season,
        "contest_format": args.contest_format,
        "minimum_edge": MIN_EDGE,
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

                    if chosen is None:
                        continue

                    used.add(chosen["team_id"])

                    picks.append({
                        "leg_number": leg["leg_number"],
                        "leg_code": leg["leg_code"],
                        "leg_name": leg["leg_name"],
                        "team": chosen["team_abbr"],
                        "game_id": chosen["game_id"],
                        "semisharp_line": f"{chosen['team_abbr']} {round(float(chosen['semisharp_spread']), 1)}",
                        "market_line": round(float(chosen["market_spread"]), 1),
                        "edge_points": round(float(chosen["edge_points"]), 2),
                        "risk_stars": chosen["risk_stars"],
                        "risk_level": chosen["risk_level"],
                        "risk_points": round(float(chosen["risk_score"]), 2),
                        "risk_summary": chosen["risk_summary"],
                        "adjusted_score": round(float(chosen["adjusted_score"]), 2),
                        "sportsbook_count": chosen["sportsbook_count"],
                        "rationale": "Selected highest adjusted edge using market V3 risk multiplier penalty."
                    })

                    # Generate up to two alternative edge recommendations for current live week
                    if leg["nfl_week"] == current_active_week and leg["special_leg_type"] is None:
                        alt_nodes = []
                        for alt_c in candidates[valid_idx + 1:]:
                            if alt_c["team_id"] not in used and alt_c["game_id"] != chosen["game_id"]:
                                alt_nodes.append({
                                    "team": alt_c["team_abbr"],
                                    "game_id": alt_c["game_id"],
                                    "semisharp_line": f"{alt_c['team_abbr']} {round(float(alt_c['semisharp_spread']), 1)}",
                                    "market_line": round(float(alt_c["market_spread"]), 1),
                                    "edge_points": round(float(alt_c["edge_points"]), 2),
                                    "risk_stars": alt_c["risk_stars"],
                                    "risk_level": alt_c["risk_level"],
                                    "risk_points": round(float(alt_c["risk_score"]), 2),
                                    "risk_summary": alt_c["risk_summary"],
                                    "adjusted_score": round(float(alt_c["adjusted_score"]), 2),
                                    "sportsbook_count": alt_c["sportsbook_count"]
                                })
                                if len(alt_nodes) >= 2:
                                    break
                        current_week_alternatives = alt_nodes

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
