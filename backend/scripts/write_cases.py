import textwrap, pathlib
src = textwrap.dedent("""
import json, logging, os, uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)
MAX_CLARIFICATION_ROUNDS = 2

def _get_conn():
    db_url = os.getenv("DATABASE_URL")
    if not db_url: return None
    try: return psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    except Exception as e: logger.warning("cases DB connect: %s", e); return None

def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    if not conn: return None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cases WHERE case_id = %s", [case_id])
            row = cur.fetchone()
            if not row: return None
            row = dict(row)
            now = datetime.now(timezone.utc)
            exp = row.get("expires_at")
            if exp and exp < now and row.get("status") != "expired":
                cur.execute("UPDATE cases SET status=$$expired$$, updated_at=now() WHERE case_id=%s", [case_id])
                conn.commit(); row["status"] = "expired"
            return row
    except Exception as e: logger.warning("get_case: %s", e); return None
    finally: conn.close()

def create_case(original_query, category, jurisdiction, facts=None) -> Optional[str]:
    conn = _get_conn(); new_id = str(uuid.uuid4())
    if not conn: return new_id
    try:
        with conn.cursor() as cur:
            cur.execute("""INSERT INTO cases (case_id,status,category,jurisdiction,original_query,facts,clarification_round,asked_facts) VALUES (%s,$$processing$$,%s,%s,%s,%s::jsonb,0,$$[]$$::jsonb)""",
                [new_id, category, jurisdiction, original_query, json.dumps(facts or {})])
            conn.commit(); return new_id
    except Exception as e: logger.warning("create_case: %s", e); return new_id
    finally: conn.close()

def update_case_awaiting(case_id, clarification_round, asked_fact, category, jurisdiction, facts):
    conn = _get_conn()
    if not conn: return
    try:
        with conn.cursor() as cur:
            sql = """UPDATE cases SET status=$$awaiting_clarification$$, clarification_round=%s, asked_facts=asked_facts || %s::jsonb, category=COALESCE(%s,category), jurisdiction=COALESCE(%s,jurisdiction), facts=facts || %s::jsonb, updated_at=now() WHERE case_id=%s"""
            cur.execute(sql, [clarification_round, json.dumps([asked_fact]), category, jurisdiction, json.dumps(facts), case_id])
            conn.commit()
    except Exception as e: logger.warning("update_case_awaiting: %s", e)
    finally: conn.close()

def update_case_resolved(case_id, category, result_payload):
    conn = _get_conn()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("""UPDATE cases SET status=$$resolved$$, category=COALESCE(%s,category), result=%s::jsonb, updated_at=now() WHERE case_id=%s""",
                [category, json.dumps(result_payload), case_id])
            conn.commit()
    except Exception as e: logger.warning("update_case_resolved: %s", e)
    finally: conn.close()

def update_case_facts(case_id, new_facts):
    conn = _get_conn()
    if not conn: return
    try:
        with conn.cursor() as cur:
            cur.execute("""UPDATE cases SET facts=facts || %s::jsonb, status=$$processing$$, updated_at=now() WHERE case_id=%s""",
                [json.dumps(new_facts), case_id])
            conn.commit()
    except Exception as e: logger.warning("update_case_facts: %s", e)
    finally: conn.close()
""").lstrip()
pathlib.Path("backend/app/cases.py").write_text(src, encoding="utf-8")
print("Written", len(src), "bytes")

