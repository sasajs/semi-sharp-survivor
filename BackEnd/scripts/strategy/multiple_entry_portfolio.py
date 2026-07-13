import argparse
import json
from app.db import get_connection

DIVERSIFICATION_TOLERANCE = 3.0

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    parser.add_argument("--user-id", type=int, required=True)
    return parser.parse_args()

def get_candidates(cur, args, leg):
    params = [args.season, args.rating_week, args.hfa_source]
    
    if leg["special_leg_type"] == "THANKSGIVING":
        filter_sql = "g.is_thanksgiving = TRUE"
    elif leg["special_leg_type"] == "CHRISTMAS":
        filter_sql = "g.is_christmas = TRUE"
    else:
        filter_sql = "g.week = %s"
        params.append(leg["nfl_week"])
        if args.contest_format == "CIRCA":
            filter_sql += " AND g.is_thanksgiving = FALSE AND g.is_christmas = FALSE"

    cur.execute(f"""
        SELECT
            p.game_id,
            p.projected_favorite_team_id AS team_id,
            p.projected_favorite_abbr,
            p.projected_spread,
            ABS(p.projected_spread) AS spread_strength
        FROM projections.game_spreads p
        JOIN schedule.games g ON g.game_id = p.game_id
        WHERE p.season = %s
          AND p.rating_week = %s
          AND p.hfa_source_system = %s
          AND {filter_sql}
        ORDER BY ABS(p.projected_spread) DESC;
    """, params)

    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

def main():
    args = parse_args()

    output = {
        "strategy": "MULTIPLE_ENTRY_PORTFOLIO",
        "strategy_version": "v1",
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "diversification_tolerance": DIVERSIFICATION_TOLERANCE,
        "entries": []
    }

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Fetch active entries
            cur.execute("""
                SELECT entry_id, survivor_sweat_name
                FROM survivor.entries
                WHERE is_active = TRUE AND user_id = %s
                ORDER BY entry_id;
            """, (args.user_id,))
            entries = [{"entry_id": r[0], "survivor_sweat_name": r[1], "used": set(), "picks": []} for r in cur.fetchall()]

            # Load already used teams for each entry
            for entry in entries:
                cur.execute("SELECT team_id FROM survivor.entry_picks WHERE entry_id = %s;", (entry["entry_id"],))
                entry["used"] = {r[0] for r in cur.fetchall()}

            # Fetch contest legs
            cur.execute("""
                SELECT l.contest_leg_id, l.leg_number, l.leg_code, l.leg_name, l.nfl_week, l.special_leg_type
                FROM contest.legs l
                JOIN contest.formats f ON f.contest_format_id = l.contest_format_id
                WHERE l.season = %s AND f.format_code = %s
                ORDER BY l.leg_number;
            """, (args.season, args.contest_format))

            cols = [d[0] for d in cur.description]
            legs = [dict(zip(cols, row)) for row in cur.fetchall()]

            processing_order = legs
            if args.contest_format == "CIRCA":
                special = [l for l in legs if l["special_leg_type"] in ("THANKSGIVING", "CHRISTMAS")]
                normal = [l for l in legs if l["special_leg_type"] is None]
                processing_order = special + normal

            for leg in processing_order:
                candidates = get_candidates(cur, args, leg)
                teams_used_this_leg = set()

                if not candidates:
                    continue

                best_strength = float(candidates[0]["spread_strength"])

                for entry in entries:
                    chosen = None

                    # Pass 1: Try to diversify
                    for c in candidates:
                        strength = float(c["spread_strength"])
                        if c["team_id"] not in entry["used"] and c["team_id"] not in teams_used_this_leg:
                            if best_strength - strength <= DIVERSIFICATION_TOLERANCE:
                                chosen = c
                                break

                    # Pass 2: Fallback to best available
                    if chosen is None:
                        for c in candidates:
                            if c["team_id"] not in entry["used"]:
                                chosen = c
                                break

                    if chosen:
                        entry["used"].add(chosen["team_id"])
                        teams_used_this_leg.add(chosen["team_id"])
                        entry["picks"].append({
                            "leg_number": leg["leg_number"],
                            "leg_code": leg["leg_code"],
                            "leg_name": leg["leg_name"],
                            "team": chosen["projected_favorite_abbr"],
                            "projected_line": f"{chosen['projected_favorite_abbr']} {round(float(chosen['projected_spread']), 1)}",
                            "game_id": chosen["game_id"],
                            "spread_strength": round(float(chosen["spread_strength"]), 2),
                            "rationale": "Selected strong available pick while diversifying across active entries."
                        })

            # Format output with entry_id as string for frontend compatibility
            for entry in entries:
                entry["picks"].sort(key=lambda x: x["leg_number"])
                output["entries"].append({
                    "entry_id": str(entry["entry_id"]),
                    "survivor_sweat_name": entry["survivor_sweat_name"],
                    "picks": entry["picks"]
                })

    print(json.dumps(output, indent=2, default=str))

if __name__ == "__main__":
    main()
