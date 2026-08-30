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
MAX_CLARIFICATION_ROUNDS = 2

# In-memory fallback dictionary when database is unavailable (e.g. testing/offline)
_IN_MEMORY_CASES: Dict[str, Dict[str, Any]] = {}


def _get_conn():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url:
        return None
    try:
        return psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    except Exception as e:
        logger.warning("DB connect: %s", e)
        return None


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    if not conn:
        row = _IN_MEMORY_CASES.get(case_id)
        if not row:
            return None
        return dict(row)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cases WHERE case_id = %s", [case_id])
            row = cur.fetchone()
            if not row:
                return None
            row = dict(row)
            now = datetime.now(timezone.utc)
            exp = row.get("expires_at")
            if exp and exp < now and row.get("status") != "expired":
                cur.execute(
                    "UPDATE cases SET status=%s, updated_at=now() WHERE case_id=%s",
                    ["expired", case_id],
                )
                conn.commit()
                row["status"] = "expired"
            return row
    except Exception as e:
        logger.warning("get_case: %s", e)
        return _IN_MEMORY_CASES.get(case_id)
    finally:
        conn.close()


def create_case(
    original_query: str,
    category: Optional[str],
    jurisdiction: str,
    facts: Optional[Dict[str, Any]] = None,
) -> str:
    new_id = str(uuid.uuid4())
    facts_dict = facts or {}
    case_obj = {
        "case_id": new_id,
        "status": "processing",
        "category": category,
        "jurisdiction": jurisdiction,
        "original_query": original_query,
        "facts": facts_dict,
        "clarification_round": 0,
        "asked_facts": [],
    }
    _IN_MEMORY_CASES[new_id] = case_obj

    conn = _get_conn()
    if not conn:
        return new_id
    try:
        with conn.cursor() as cur:
            sql = (
                "INSERT INTO cases (case_id,status,category,jurisdiction,"
                "original_query,facts,clarification_round,asked_facts) "
                "VALUES (%s,%s,%s,%s,%s,%s::jsonb,0,%s::jsonb)"
            )
            cur.execute(
                sql,
                [
                    new_id,
                    "processing",
                    category,
                    jurisdiction,
                    original_query,
                    json.dumps(facts_dict),
                    "[]",
                ],
            )
            conn.commit()
            return new_id
    except Exception as e:
        logger.warning("create_case: %s", e)
        return new_id
    finally:
        conn.close()


def update_case_awaiting(
    case_id: str,
    clarification_round: int,
    asked_fact: str,
    category: Optional[str],
    jurisdiction: str,
    facts: Dict[str, Any],
):
    if case_id in _IN_MEMORY_CASES:
        c = _IN_MEMORY_CASES[case_id]
        c["status"] = "awaiting_clarification"
        c["clarification_round"] = clarification_round
        if asked_fact not in c.get("asked_facts", []):
            c.setdefault("asked_facts", []).append(asked_fact)
        if category:
            c["category"] = category
        c["jurisdiction"] = jurisdiction
        c.setdefault("facts", {}).update(facts)

    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            OR = " || "
            sql = (
                "UPDATE cases SET status=%s, clarification_round=%s, "
                "asked_facts=asked_facts" + OR + "%s::jsonb, "
                "category=COALESCE(%s,category), jurisdiction=COALESCE(%s,jurisdiction), "
                "facts=facts" + OR + "%s::jsonb, updated_at=now() WHERE case_id=%s"
            )
            cur.execute(
                sql,
                [
                    "awaiting_clarification",
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
        logger.warning("update_case_awaiting: %s", e)
    finally:
        conn.close()


def update_case_resolved(case_id: str, category: Optional[str], result_payload: Dict[str, Any]):
    if case_id in _IN_MEMORY_CASES:
        c = _IN_MEMORY_CASES[case_id]
        c["status"] = "resolved"
        if category:
            c["category"] = category
        c["result"] = result_payload

    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            sql = (
                "UPDATE cases SET status=%s, category=COALESCE(%s,category), "
                "result=%s::jsonb, updated_at=now() WHERE case_id=%s"
            )
            cur.execute(sql, ["resolved", category, json.dumps(result_payload), case_id])
            conn.commit()
    except Exception as e:
        logger.warning("update_case_resolved: %s", e)
    finally:
        conn.close()


def update_case_facts(case_id: str, new_facts: Dict[str, Any]):
    if case_id in _IN_MEMORY_CASES:
        c = _IN_MEMORY_CASES[case_id]
        c["status"] = "processing"
        c.setdefault("facts", {}).update(new_facts)

    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            OR = " || "
            sql = (
                "UPDATE cases SET facts=facts"
                + OR
                + "%s::jsonb, status=%s, updated_at=now() WHERE case_id=%s"
            )
            cur.execute(sql, [json.dumps(new_facts), "processing", case_id])
            conn.commit()
    except Exception as e:
        logger.warning("update_case_facts: %s", e)
    finally:
        conn.close()


def reset_case_facts(case_id: str, new_category: str):
    """Resets facts to empty on topic drift."""
    if case_id in _IN_MEMORY_CASES:
        c = _IN_MEMORY_CASES[case_id]
        c["facts"] = {}
        c["category"] = new_category

    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            sql = "UPDATE cases SET facts='{}'::jsonb, category=%s, updated_at=now() WHERE case_id=%s"
            cur.execute(sql, [new_category, case_id])
            conn.commit()
    except Exception as e:
        logger.warning("reset_case_facts: %s", e)
    finally:
        conn.close()
