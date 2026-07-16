from app.db import get_connection


SEASON = 2026


def main():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM contest.legs WHERE season = %s;", (SEASON,))

            cur.execute("""
                SELECT contest_format_id, format_code
                FROM contest.formats
                WHERE is_active = TRUE
                ORDER BY contest_format_id;
            """)
            formats = cur.fetchall()

            for contest_format_id, format_code in formats:
                leg_number = 1

                for week in range(1, 19):
                    cur.execute("""
                        INSERT INTO contest.legs (
                            contest_format_id,
                            season,
                            leg_number,
                            leg_code,
                            leg_name,
                            nfl_week,
                            is_special_leg,
                            special_leg_type
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, FALSE, NULL)
                        ON CONFLICT (contest_format_id, season, leg_code)
                        DO NOTHING;
                    """, (
                        contest_format_id,
                        SEASON,
                        leg_number,
                        f"WEEK_{week}",
                        f"Week {week}",
                        week
                    ))

                    leg_number += 1

                    if format_code == "CIRCA" and week == 12:
                        cur.execute("""
                            INSERT INTO contest.legs (
                                contest_format_id,
                                season,
                                leg_number,
                                leg_code,
                                leg_name,
                                nfl_week,
                                is_special_leg,
                                special_leg_type
                            )
                            VALUES (%s, %s, %s, 'THANKSGIVING', 'Thanksgiving', 13, TRUE, 'THANKSGIVING')
                            ON CONFLICT (contest_format_id, season, leg_code)
                            DO NOTHING;
                        """, (contest_format_id, SEASON, leg_number))
                        leg_number += 1

                    if format_code == "CIRCA" and week == 16:
                        cur.execute("""
                            INSERT INTO contest.legs (
                                contest_format_id,
                                season,
                                leg_number,
                                leg_code,
                                leg_name,
                                nfl_week,
                                is_special_leg,
                                special_leg_type
                            )
                            VALUES (%s, %s, %s, 'CHRISTMAS', 'Christmas', 17, TRUE, 'CHRISTMAS')
                            ON CONFLICT (contest_format_id, season, leg_code)
                            DO NOTHING;
                        """, (contest_format_id, SEASON, leg_number))
                        leg_number += 1

        conn.commit()

    print("Generated contest legs for season 2026.")


if __name__ == "__main__":
    main()
