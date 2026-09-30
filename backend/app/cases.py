# backend/app/cases.py

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)
MAX_CLARIFICATION_ROUNDS = 3


def _get_conn():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url:
        return None
    try:
        return psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    except Exception as e:
        logger.warning("cases DB connect failed: %s", e)
        return None


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    if not conn:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cases WHERE case_id = %s", [case_id])
            row = cur.fetchone()
            if not row:
                return None
            row = dict(row)
            row["case_id"] = str(row["case_id"])
            now = datetime.now(timezone.utc)
            exp = row.get("expires_at")
            if exp and exp < now and row.get("status") != "expired":
                cur.execute(
                    "UPDATE cases SET status = 'expired', updated_at = now() WHERE case_id = %s",
                    [case_id],
                )
                conn.commit()
                row["status"] = "expired"

            # Parse JSON fields if returned as string
            for k in ("facts", "asked_facts", "result"):
                if isinstance(row.get(k), str):
                    try:
                        row[k] = json.loads(row[k])
                    except Exception:
                        pass
            return row
    except Exception as e:
        logger.warning("get_case error for %s: %s", case_id, e)
        return None
    finally:
        conn.close()


def create_case(
    original_query: str,
    category: Optional[str],
    jurisdiction: Optional[str],
    user_name: Optional[str] = None,
    facts: Optional[dict] = None,
    case_id: Optional[str] = None,
) -> str:
    new_id = case_id or str(uuid.uuid4())
    conn = _get_conn()
    if not conn:
        return new_id
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO cases (
                    case_id, status, category, jurisdiction,
                    original_query, user_name, facts,
                    clarification_round, asked_facts
                ) VALUES (
                    %s, 'processing', %s, %s,
                    %s, %s, %s::jsonb,
                    0, '[]'::jsonb
                )
                ON CONFLICT (case_id) DO UPDATE SET
                    original_query = EXCLUDED.original_query,
                    user_name = COALESCE(EXCLUDED.user_name, cases.user_name),
                    updated_at = now()
                """,
                [
                    new_id,
                    category,
                    jurisdiction,
                    original_query,
                    user_name,
                    json.dumps(facts or {}),
                ],
            )
            conn.commit()
            return new_id
    except Exception as e:
        logger.warning("create_case error: %s", e)
        return new_id
    finally:
        conn.close()


def update_case_awaiting(
    case_id: str,
    clarification_round: int,
    asked_fact: str,
    category: Optional[str],
    jurisdiction: Optional[str],
    facts: dict,
):
    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            sql = """
                UPDATE cases
                SET status = 'awaiting_clarification',
                    clarification_round = %s,
                    asked_facts = asked_facts || %s::jsonb,
                    category = COALESCE(%s, category),
                    jurisdiction = COALESCE(%s, jurisdiction),
                    facts = facts || %s::jsonb,
                    updated_at = now()
                WHERE case_id = %s
            """
            cur.execute(
                sql,
                [
                    clarification_round,
                    json.dumps([asked_fact]),
                    category,
                    jurisdiction,
                    json.dumps(facts),
                    case_id,
                ],
            )
            conn.commit()
    except Exception as e:
        logger.warning("update_case_awaiting error: %s", e)
    finally:
        conn.close()


def update_case_resolved(case_id: str, category: Optional[str], result_payload: dict):
    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE cases
                SET status = 'resolved',
                    category = COALESCE(%s, category),
                    result = %s::jsonb,
                    updated_at = now()
                WHERE case_id = %s
                """,
                [category, json.dumps(result_payload), case_id],
            )
            conn.commit()
    except Exception as e:
        logger.warning("update_case_resolved error: %s", e)
    finally:
        conn.close()


def update_case_facts(case_id: str, new_facts: dict):
    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE cases
                SET facts = facts || %s::jsonb,
                    updated_at = now()
                WHERE case_id = %s
                """,
                [json.dumps(new_facts), case_id],
            )
            conn.commit()
    except Exception as e:
        logger.warning("update_case_facts error: %s", e)
    finally:
        conn.close()
