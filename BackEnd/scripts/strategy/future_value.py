import argparse
import json
import sys
from app.db import get_connection

# V3 Calibration: Future Value penalty weight
FUTURE_VALUE_WEIGHT = 0.35

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--contest-format", choices=["STANDARD", "CIRCA"], required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    # Added required entry-id for session-aware execution
    parser.add_argument("--entry-id", type=int, required=True, help="Survivor Entry ID")
    return parser.parse_args()

def get_legs(cur, args):
    cur.execute("""
        SELECT l.contest_leg_id, l.leg_number, l.leg_code, l.leg_name, l.nfl_week, l.special_leg_type
        FROM contest.legs l
        JOIN contest.formats f ON f.contest_format_id = l.contest_format_id
        WHERE l.season = %s AND f.format_code = %s
        ORDER BY l.leg_number;
    """, (args.season, args.contest_format))
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

def get_candidates_with_risk(cur, args, leg):
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
        WHERE p.season = %s AND p.rating_week = %s AND p.hfa_source_system = %s AND {filter_sql}
        ORDER BY ABS(p.projected_spread) DESC;
    """, params)

    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

def calculate_future_value(team_id, current_leg_number, candidates_by_leg):
    future_scores = []
    for leg_number, candidates in candidates_by_leg.items():
        if leg_number <= current_leg_number: continue
        for candidate in candidates:
            if candidate["team_id"] == team_id:
                future_scores.append(float(candidate["spread_strength"]))
    return max(future_scores) if future_scores else 0.0

def get_current_application_context(cur):
    cur.execute("SELECT current_week FROM system.application_context WHERE is_active = TRUE LIMIT 1;")
    row = cur.fetchone()
    return row[0] if row else 1

def main():
    args = parse_args()
    output = {
        "strategy": "FUTURE_VALUE",
        "strategy_version": "v3.0",
        "entries": []
    }

    with get_connection() as conn:
        with conn.cursor() as cur:
            current_active_week = get_current_application_context(cur)
            legs = get_legs(cur, args)
            candidates_by_leg = {leg["leg_number"]: get_candidates_with_risk(cur, args, leg) for leg in legs}

            processing_order = legs if args.contest_format != "CIRCA" else ([l for l in legs if l["special_leg_type"]] + [l for l in legs if not l["special_leg_type"]])

            cur.execute("SELECT entry_id, survivor_sweat_name FROM survivor.entries WHERE entry_id = %s", (args.entry_id,))
            entry = cur.fetchone()
            if not entry: sys.exit(1)
            
            entry_id, sweat_name = entry
            cur.execute("SELECT team_id FROM survivor.entry_picks WHERE entry_id = %s", (entry_id,))
            used = {r[0] for r in cur.fetchall()}

            picks, current_week_alternatives = [], []

            for leg in processing_order:
                scored = []
                for candidate in candidates_by_leg[leg["leg_number"]]:
                    if candidate["team_id"] in used: continue
                    current_strength = float(candidate["spread_strength"])
                    future_value = calculate_future_value(candidate["team_id"], leg["leg_number"], candidates_by_leg)
                    # V3 Risk-Aware Adjustment
                    adjusted_score = current_strength - (FUTURE_VALUE_WEIGHT * future_value) - float(candidate["risk_score"])
                    scored.append({**candidate, "adjusted_score": adjusted_score})

                if not scored: continue
                scored.sort(key=lambda x: x["adjusted_score"], reverse=True)
                chosen = scored[0]
                used.add(chosen["team_id"])
                
                picks.append({
                    "leg": leg["leg_number"],
                    "team": chosen["projected_favorite_abbr"],
                    "adjusted_score": round(chosen["adjusted_score"], 2),
                    "risk_stars": chosen["risk_stars"]
                })

                if leg["nfl_week"] == current_active_week:
                    current_week_alternatives = [{"team": a["projected_favorite_abbr"], "risk": a["risk_stars"]} for a in scored[1:3]]

            output["entries"].append({"entry_id": entry_id, "picks": picks, "alts": current_week_alternatives})
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
