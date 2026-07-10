import argparse
import json
from app.db import get_connection


HOLIDAY_TEAM_PROTECTION = True


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()


def get_candidates(cur, args, leg):
    if leg["special_leg_type"] == "THANKSGIVING":
        filter_sql = "g.is_thanksgiving = TRUE"
        params = [args.season, args.rating_week, args.hfa_source]
    elif leg["special_leg_type"] == "CHRISTMAS":
        filter_sql = "g.is_christmas = TRUE"
        params = [args.season, args.rating_week, args.hfa_source]
    else:
        filter_sql = "g.week = %s AND g.is_thanksgiving = FALSE AND g.is_christmas = FALSE"
        params = [args.season, args.rating_week, args.hfa_source, leg["nfl_week"]]

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
        "strategy": "CIRCA_HOLIDAY_RESERVE",
        "strategy_version": "v1",
        "season": args.season,
        "contest_format": "CIRCA",
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "holiday_team_protection": HOLIDAY_TEAM_PROTECTION,
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
                  AND f.format_code = 'CIRCA'
                ORDER BY l.leg_number;
            """, (args.season,))

            cols = [d[0] for d in cur.description]
            legs = [dict(zip(cols, row)) for row in cur.fetchall()]

            holiday_legs = [l for l in legs if l["special_leg_type"] in ("THANKSGIVING", "CHRISTMAS")]
            normal_legs = [l for l in legs if l["special_leg_type"] is None]
            processing_order = holiday_legs + normal_legs

            holiday_team_ids = set()
            for leg in holiday_legs:
                for c in get_candidates(cur, args, leg):
                    holiday_team_ids.add(c["team_id"])

            for entry_id, sweat_name in entries:
                cur.execute("SELECT team_id FROM survivor.entry_picks WHERE entry_id = %s;", (entry_id,))
                used = {r[0] for r in cur.fetchall()}
                picks = []

                for leg in processing_order:
                    candidates = get_candidates(cur, args, leg)
                    chosen = None

                    for c in candidates:
                        if c["team_id"] in used:
                            continue

                        if (
                            HOLIDAY_TEAM_PROTECTION
                            and leg["special_leg_type"] is None
                            and c["team_id"] in holiday_team_ids
                        ):
                            continue

                        chosen = c
                        break

                    if chosen is None:
                        for c in candidates:
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
                        "team": chosen["projected_favorite_abbr"],
                        "projected_line": f"{chosen['projected_favorite_abbr']} {round(float(chosen['projected_spread']), 1)}",
                        "game_id": chosen["game_id"],
                        "spread_strength": round(float(chosen["spread_strength"]), 2),
                        "rationale": "Holiday teams reserved first; normal weeks avoid holiday-team usage when possible."
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
