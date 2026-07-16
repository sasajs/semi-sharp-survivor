import argparse
from app.db import get_connection

SOURCE_SYSTEM = "SEMISHARP_RISK_V3"

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()

def get_risk_weight(cur, risk_type):
    cur.execute("SELECT default_points, severity FROM risk.risk_factor_weights WHERE risk_type = %s AND active = TRUE", (risk_type,))
    result = cur.fetchone()
    if result is None: raise Exception(f"No active risk weight found for {risk_type}")
    return result[1], result[0]

def insert_risk(cur, game, team_id, risk_type, severity, risk_points, description):
    cur.execute("""
        INSERT INTO risk.game_risk_factors (season, week, game_id, team_id, risk_type, severity, risk_points, description, source_system)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (game_id, team_id, risk_type, source_system) 
        DO UPDATE SET severity = EXCLUDED.severity, risk_points = EXCLUDED.risk_points, description = EXCLUDED.description, created_at = now();
    """, (game["season"], game["week"], game["game_id"], team_id, risk_type, severity, risk_points, description, SOURCE_SYSTEM))

def add_risk(cur, game, team_id, risk_type, description):
    severity, points = get_risk_weight(cur, risk_type)
    insert_risk(cur, game, team_id, risk_type, severity, points, description)

def process_week(cur, season, week, rating_week, hfa_source):
    inserted_count = 0
    cur.execute("""
        SELECT g.*, at.team_abbr AS away_team, ht.team_abbr AS home_team,
               p.projected_favorite_team_id, p.projected_favorite_abbr, p.projected_spread,
               pff_home.point_spread_rating AS home_pff_rating, pff_away.point_spread_rating AS away_pff_rating,
               pff_home.qb_rating AS home_qb_rating, pff_away.qb_rating AS away_qb_rating,
               sic_home.sic_score AS home_sic_score, sic_away.sic_score AS away_sic_score
        FROM schedule.games g
        JOIN reference.teams at ON at.team_id = g.away_team_id
        JOIN reference.teams ht ON ht.team_id = g.home_team_id
        JOIN projections.game_spreads p ON p.game_id = g.game_id AND p.rating_week = %s AND p.hfa_source_system = %s
        LEFT JOIN ratings.pff_power_ratings pff_home ON pff_home.team_id = g.home_team_id AND pff_home.season = g.season AND pff_home.week = %s
        LEFT JOIN ratings.pff_power_ratings pff_away ON pff_away.team_id = g.away_team_id AND pff_away.season = g.season AND pff_away.week = %s
        LEFT JOIN injuries.team_sic_scores sic_home ON sic_home.team_id = g.home_team_id AND sic_home.season = g.season AND sic_home.week = g.week
        LEFT JOIN injuries.team_sic_scores sic_away ON sic_away.team_id = g.away_team_id AND sic_away.season = g.season AND sic_away.week = g.week
        WHERE g.season = %s AND g.week = %s
    """, (rating_week, hfa_source, rating_week, rating_week, season, week))
    
    if cur.description:
        games = [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]
        for game in games:
            fav_id = game["projected_favorite_team_id"]
            if not fav_id: continue
            
            # --- Business Logic ---
            if fav_id == game["away_team_id"]:
                add_risk(cur, game, fav_id, "AWAY_FAVORITE", f"{game['projected_favorite_abbr']} is favored on the road.")
                inserted_count += 1
            
            spread = abs(game["projected_spread"])
            risk_map = {3: "SMALL_FAVORITE_RISK", 7: "MODERATE_FAVORITE_RISK", 14: "LARGE_FAVORITE_RISK"}
            for limit, r_type in risk_map.items():
                if spread <= limit:
                    add_risk(cur, game, fav_id, r_type, f"Favorite spread is {spread:.1f} points.")
                    inserted_count += 1
                    break
    return inserted_count

def main():
    args = parse_args()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT week FROM schedule.games WHERE season = %s ORDER BY week", (args.season,))
            for (week,) in cur.fetchall():
                cur.execute("DELETE FROM risk.game_risk_factors WHERE season = %s AND week = %s AND source_system = %s", (args.season, week, SOURCE_SYSTEM))
                inserted = process_week(cur, args.season, week, args.rating_week, args.hfa_source)
                print(f"Processed Week {week}: Inserted {inserted} factors.")
        conn.commit()
    print("Full season V3 generation complete.")

if __name__ == "__main__":
    main()
