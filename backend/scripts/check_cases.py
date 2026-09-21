import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
if url:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT to_regclass('public.cases');")
    res = cur.fetchone()
    print("cases table:", res[0])
    if res[0]:
        cur.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS user_name TEXT;")
        conn.commit()
        print("user_name column ensured on cases table")
    conn.close()
