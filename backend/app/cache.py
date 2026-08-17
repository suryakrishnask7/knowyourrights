import os
import json
import hashlib
import logging
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

def get_corpus_version() -> int:
    """Retrieve the current corpus_version from environment."""
    try:
        return int(os.getenv("CORPUS_VERSION", "1"))
    except ValueError:
        return 1

def make_cache_key(category: str, jurisdiction: str, missing_facts: List[str]) -> str:
    """
    Build the cache key from classification output, not raw query text —
    this is what makes paraphrases ('landlord didn't return deposit' vs.
    'lessor kept my advance') collapse to the same cache entry, since both
    classify to the same category before this function ever runs.
    """
    facts_signature = ",".join(sorted(missing_facts))
    raw = f"{category}|{jurisdiction}|{facts_signature}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url:
        return None
    try:
        return psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    except Exception as e:
        logger.warning(f"Could not connect to database for cache: {e}")
        return None

async def get_cached_response(cache_key: str, corpus_version: int, db=None) -> Optional[Dict[str, Any]]:
    """
    Return the cached response only if corpus_version matches current —
    a stale version means the underlying law may have changed since this
    was cached, so treat it as a miss.
    """
    conn = db or get_db_connection()
    if not conn:
        return None

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT response, corpus_version, evidence_level
                FROM response_cache
                WHERE cache_key = %s AND corpus_version = %s
            """, [cache_key, corpus_version])
            row = cur.fetchone()
            if row:
                resp = row["response"]
                if isinstance(resp, str):
                    resp = json.loads(resp)
                logger.info(f"Cache HIT for key {cache_key} (version {corpus_version})")
                return resp
            logger.info(f"Cache MISS for key {cache_key} (version {corpus_version})")
            return None
    except Exception as e:
        logger.warning(f"Error querying response_cache: {e}")
        return None
    finally:
        if not db and conn:
            conn.close()

async def set_cached_response(
    cache_key: str,
    category: str,
    jurisdiction: str,
    corpus_version: int,
    response: Dict[str, Any],
    evidence_level: str,
    db=None
) -> None:
    """
    Only ever called when evidence_level is 'High' or 'Medium'. Never
    call this for a 'Low' evidence response — that response is specific to
    what this particular user did or didn't say, and caching it would
    silently misapply their evidence gap to a different user's query.
    
    Enforced at code level: raises ValueError if evidence_level is Low.
    """
    if evidence_level.strip().lower() == "low":
        raise ValueError("Security/Integrity Error: Cannot cache response with 'Low' evidence level.")

    conn = db or get_db_connection()
    if not conn:
        return

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO response_cache (cache_key, category, jurisdiction, corpus_version, response, evidence_level)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s)
                ON CONFLICT (cache_key) DO UPDATE SET
                  corpus_version = EXCLUDED.corpus_version,
                  response = EXCLUDED.response,
                  evidence_level = EXCLUDED.evidence_level,
                  created_at = now();
            """, [
                cache_key,
                category,
                jurisdiction,
                corpus_version,
                json.dumps(response),
                evidence_level
            ])
            conn.commit()
            logger.info(f"Cached response for key {cache_key} (version {corpus_version}, evidence {evidence_level})")
    except Exception as e:
        logger.warning(f"Error saving to response_cache: {e}")
    finally:
        if not db and conn:
            conn.close()
