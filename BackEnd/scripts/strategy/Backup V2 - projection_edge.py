import argparse
import json
from app.db import get_connection


MIN_EDGE = 0.0


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    return parser.parse_args()


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
            e.game_id,
            e.team_id,
            e.team_abbr,
            e.semisharp_spread,
            e.market_spread,
            e.edge_points,
            e.sportsbook_count,
            CASE
                WHEN r.game_id IS NULL THEN 0
                ELSE r.total_risk_points
            END AS risk_points,
            CASE
                WHEN r.game_id IS NULL THEN 'NOT_CALCULATED'
                ELSE r.risk_types
            END AS risk_types,
            (e.edge_points - COALESCE(r.total_risk_points, 0)) AS adjusted_score
        FROM market.projection_edges e
        JOIN schedule.games g ON g.game_id = e.game_id
        LEFT JOIN risk.game_risk_summary r
          ON r.game_id = e.game_id
         AND r.team_id = e.team_id
        WHERE e.season = %s
          AND {filter_sql}
          AND e.edge_points >= %s
        ORDER BY adjusted_score DESC, e.edge_points DESC, ABS(e.semisharp_spread) DESC;
    """, params + [MIN_EDGE])

    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def main():
    args = parse_args()

    output = {
        "strategy": "PROJECTION_EDGE",
        "strategy_version": "v1",
        "season": args.season,
        "contest_format": args.contest_format,
        "minimum_edge": MIN_EDGE,
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

                for leg in processing_order:
                    chosen = None

                    for c in get_candidates(cur, args, leg):
                        if c["team_id"] not in used:
                            chosen = c
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
                        "risk_points": round(float(chosen["risk_points"]), 2),
                        "risk_types": chosen["risk_types"],
                        "adjusted_score": round(float(chosen["adjusted_score"]), 2),
                        "sportsbook_count": chosen["sportsbook_count"],
                        "rationale": "Selected strongest market edge after subtracting risk points."
                    })

                picks.sort(key=lambda x: x["leg_number"])

                output["entries"].append({
                    "entry_id": entry_id,
                    "survivor_sweat_name": sweat_name,
                    "picks": picks
                })

    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
