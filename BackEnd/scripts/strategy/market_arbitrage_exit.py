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
            COALESCE(r.risk_summary, 'No significant risk factors detected.') AS risk_summary
        FROM projections.game_spreads p
        JOIN schedule.games g ON g.game_id = p.game_id
        LEFT JOIN risk.game_risk_scores r ON r.game_id = p.game_id AND r.team_id = p.projected_favorite_team_id
        WHERE p.season = %s
          AND p.rating_week = %s
          AND p.hfa_source_system = %s
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
        "strategy": "MARKET_ARBITRAGE_EXIT",
        "strategy_version": "v3.0",
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "target_horizon": "Week 8 Marketplace Exit Maximizer",
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

            # Circa rule parsing: Holiday legs are prioritized first to protect critical narrow opportunities
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
                    scored_candidates = []

                    for c in candidates:
                        if c["team_id"] in used:
                            continue

                        current_strength = float(c["spread_strength"])
                        risk_points = float(c["risk_score"])

                        # Arbitrage Horizon Rule: Weeks 1-8 ignore future value to secure maximum cash-out value.
                        # Week 9+ falls back into default short-horizon preservation modeling.
                        if leg["nfl_week"] is not None and leg["nfl_week"] <= 8:
                            arbitrage_score = current_strength - risk_points
                            mode_label = "ARBITRAGE_MAX_SURVIVAL"
                        else:
                            # Muted penalty for remaining weeks post-horizon
                            arbitrage_score = current_strength - (0.15 * current_strength) - risk_points
                            mode_label = "POST_HORIZON_PRESERVATION"

                        scored_candidates.append({
                            "candidate": c,
                            "arbitrage_score": arbitrage_score,
                            "mode": mode_label
                        })

                    if not scored_candidates:
                        continue

                    # Sort by the custom horizon score
                    scored_candidates.sort(key=lambda x: x["arbitrage_score"], reverse=True)
                    chosen_node = scored_candidates[0]
                    chosen = chosen_node["candidate"]

                    used.add(chosen["team_id"])

                    picks.append({
                        "leg_number": leg["leg_number"],
                        "leg_code": leg["leg_code"],
                        "leg_name": leg["leg_name"],
                        "team": chosen["projected_favorite_abbr"],
                        "projected_line": f"{chosen['projected_favorite_abbr']} {round(float(chosen['projected_spread']), 1)}",
                        "game_id": chosen["game_id"],
                        "risk_stars": chosen["risk_stars"],
                        "risk_level": chosen["risk_level"],
                        "risk_points": float(chosen["risk_score"]),
                        "risk_summary": chosen["risk_summary"],
                        "rationale": f"Optimized via {chosen_node['mode']}. Safest immediate risk-adjusted choice for Week 8 marketplace asset protection."
                    })

                    # Compile user-pivoted alternative options for active tracking week
                    if leg["nfl_week"] == current_active_week and leg["special_leg_type"] is None:
                        alt_nodes = []
                        for alt_opt in scored_candidates[1:]:
                            alt_candidate = alt_opt["candidate"]
                            if alt_candidate["team_id"] not in used and alt_candidate["game_id"] != chosen["game_id"]:
                                alt_nodes.append({
                                    "team": alt_candidate["projected_favorite_abbr"],
                                    "projected_line": f"{alt_candidate['projected_favorite_abbr']} {round(float(alt_candidate['projected_spread']), 1)}",
                                    "game_id": alt_candidate["game_id"],
                                    "risk_stars": alt_candidate["risk_stars"],
                                    "risk_level": alt_candidate["risk_level"],
                                    "risk_points": float(alt_candidate["risk_score"]),
                                    "risk_summary": alt_candidate["risk_summary"]
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