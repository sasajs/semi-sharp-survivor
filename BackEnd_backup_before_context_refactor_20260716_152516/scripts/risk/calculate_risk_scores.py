import argparse
from app.db import get_connection

SOURCE_SYSTEM = "SEMISHARP_RISK_V3"

def parse_args():
    parser = argparse.ArgumentParser(description="Aggregate V3 risk factors into final game risk scores.")
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--rating-week", type=int, required=True)
    parser.add_argument("--hfa-source", required=True)
    return parser.parse_args()

def calculate_week_scores(cur, season, week):
    # 1. Clear out any existing V3 entries for this week to prevent duplicates
    cur.execute("""
        DELETE FROM risk.game_risk_scores 
        WHERE season = %s AND week = %s AND source_system = %s
    """, (season, week, SOURCE_SYSTEM))
    
    # 2. Aggregate factors grouped by game AND team to match schema[cite: 1]
    cur.execute("""
        SELECT game_id, team_id, SUM(risk_points) as total_points, COUNT(*) as f_count
        FROM risk.game_risk_factors
        WHERE season = %s AND week = %s AND source_system = %s
        GROUP BY game_id, team_id
    """, (season, week, SOURCE_SYSTEM))
    
    factors = cur.fetchall()
    inserted_count = 0
    
    # 3. Insert matching your table schema[cite: 1]
    for game_id, team_id, total_points, f_count in factors:
        if total_points >= 10:
            risk_level, stars = "HIGH", 3
        elif total_points >= 5:
            risk_level, stars = "MEDIUM", 2
        else:
            risk_level, stars = "LOW", 1
            
        cur.execute("""
            INSERT INTO risk.game_risk_scores 
            (season, week, game_id, team_id, risk_score, risk_stars, risk_level, factor_count, source_system)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (season, week, game_id, team_id, total_points, stars, risk_level, f_count, SOURCE_SYSTEM))
        inserted_count += 1
        
    return inserted_count

def main():
    args = parse_args()
    print(f"Starting V3 risk score aggregation for season {args.season}...")
    
    total_processed = 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Get all distinct weeks that have V3 risk factors[cite: 1]
            cur.execute("""
                SELECT DISTINCT week 
                FROM risk.game_risk_factors 
                WHERE season = %s AND source_system = %s 
                ORDER BY week
            """, (args.season, SOURCE_SYSTEM))
            weeks = [r[0] for r in cur.fetchall()]
            
            for week in weeks:
                inserted = calculate_week_scores(cur, args.season, week)
                print(f"Processed Week {week}: Calculated {inserted} game risk scores.")
                total_processed += inserted
                
        conn.commit()
    print(f"Full season V3 scoring complete. Total records scored: {total_processed}")

if __name__ == "__main__":
    main()
