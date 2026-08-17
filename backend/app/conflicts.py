import os
import logging
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

def check_conflicts(category: Optional[str], state: str) -> List[Dict[str, Any]]:
    """
    Query conflicts table for potential statutory conflicts between Central law and State law.
    Returns empty list if no connection or no conflicts found.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url and "postgres:postgres" in db_url:
        return []
        
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, topic, jurisdiction, central_rule, state_rule, outcome, reason
                FROM conflicts
                WHERE jurisdiction = %s
            """, [state])
            rows = cur.fetchall()
            conn.close()
            return [dict(row) for row in rows]
    except Exception as e:
        logger.warning(f"Error querying conflicts table: {e}")
        return []
