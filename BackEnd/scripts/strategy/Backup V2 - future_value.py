import argparse
import json
from app.db import get_connection


FUTURE_VALUE_WEIGHT = 0.35


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()


def get_legs(cur, args):
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
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def get_candidates(cur, args, leg):
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


def calculate_future_value(team_id, current_leg_number, candidates_by_leg):
    future_scores = []

    for leg_number, candidates in candidates_by_leg.items():
        if leg_number <= current_leg_number:
            continue

        for candidate in candidates:
            if candidate["team_id"] == team_id:
                future_scores.append(float(candidate["spread_strength"]))

    if not future_scores:
        return 0.0

    return max(future_scores)


def main():
    args = parse_args()

    output = {
        "strategy": "FUTURE_VALUE",
        "strategy_version": "v1",
        "season": args.season,
        "contest_format": args.contest_format,
        "rating_week": args.rating_week,
        "hfa_source": args.hfa_source,
        "future_value_weight": FUTURE_VALUE_WEIGHT,
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

            legs = get_legs(cur, args)

            candidates_by_leg = {
                leg["leg_number"]: get_candidates(cur, args, leg)
                for leg in legs
            }

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

                for leg in processing_order:
                    scored = []

                    for candidate in candidates_by_leg[leg["leg_number"]]:
                        if candidate["team_id"] in used:
                            continue

                        current_strength = float(candidate["spread_strength"])
                        future_value = calculate_future_value(
                            candidate["team_id"],
                            leg["leg_number"],
                            candidates_by_leg
                        )

                        adjusted_score = current_strength - (FUTURE_VALUE_WEIGHT * future_value)

                        scored.append({
                            "candidate": candidate,
                            "current_strength": current_strength,
                            "future_value": future_value,
                            "adjusted_score": adjusted_score
                        })

                    if not scored:
                        continue

                    scored.sort(key=lambda x: x["adjusted_score"], reverse=True)
                    chosen_score = scored[0]
                    chosen = chosen_score["candidate"]

                    used.add(chosen["team_id"])

                    picks.append({
                        "leg_number": leg["leg_number"],
                        "leg_code": leg["leg_code"],
                        "leg_name": leg["leg_name"],
                        "team": chosen["projected_favorite_abbr"],
                        "projected_line": f"{chosen['projected_favorite_abbr']} {round(float(chosen['projected_spread']), 1)}",
                        "game_id": chosen["game_id"],
                        "current_strength": round(chosen_score["current_strength"], 2),
                        "future_value": round(chosen_score["future_value"], 2),
                        "adjusted_score": round(chosen_score["adjusted_score"], 2),
                        "rationale": "Selected best adjusted score: current spread strength minus future value penalty."
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
