from app.db import get_connection

try:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT version();")
    version = cur.fetchone()

    print("Connected successfully!")
    print(version[0])

    cur.close()
    conn.close()

except Exception as e:
    print("Connection failed:")
    print(e)
