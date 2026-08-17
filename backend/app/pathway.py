import os
import json
import logging
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

DEFAULT_PATHWAY = {
    "authority": "District Legal Services Authority (DLSA) / Pre-Litigation Mediation & Legal Aid",
    "deadlineNote": "Act promptly within general limitation periods (typically 3 years for money recovery under Limitation Act, 1963).",
    "steps": [
        {
            "title": "Issue a formal contractual demand notice",
            "detail": "Send a formal registered demand letter or official email to the employer/opposite party stating the exact promised compensation, unpaid dates, and giving 15 days to settle dues under the Indian Contract Act.",
            "docs": [
                "Written agreement / Offer letter / WhatsApp/Email communications",
                "Bank statements / Proof of work delivered"
            ]
        },
        {
            "title": "Approach District Legal Services Authority (DLSA) / Call 15100",
            "detail": "Every District Court has a DLSA offering free legal advice and pre-litigation mediation for informal/disputed claims without court fees. A panel advocate will assist in issuing a pre-litigation mediation notice."
        },
        {
            "title": "Register an executive grievance on SAMADHAN / CPGRAMS portal",
            "detail": "Submit an online complaint on the Ministry of Labour SAMADHAN portal (samadhan.labour.gov.in) or Central Public Grievance Portal (pgportal.gov.in) for administrative intervention."
        }
    ]
}

def get_pathway(category: Optional[str]) -> Dict[str, Any]:
    """
    Deterministic lookup of the procedural pathway for a given category.
    Queries Supabase pathways table if available, else falls back to default.
    """
    if not category:
        return DEFAULT_PATHWAY

    db_url = os.getenv("DATABASE_URL")
    if db_url and "localhost:5432/postgres" not in db_url:
        try:
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
            with conn.cursor() as cur:
                cur.execute("SELECT category, authority, deadline_days, deadline_note, steps FROM pathways WHERE category = %s", [category])
                row = cur.fetchone()
                conn.close()
                if row:
                    steps_data = row["steps"]
                    if isinstance(steps_data, str):
                        steps_data = json.loads(steps_data)
                    return {
                        "authority": row["authority"],
                        "deadlineNote": row["deadline_note"],
                        "steps": steps_data
                    }
        except Exception as e:
            logger.warning(f"Error fetching pathway from database: {e}")

    # Fallback in-memory pathways for key categories
    from app.pathways_fallback import FALLBACK_PATHWAYS
    if category in FALLBACK_PATHWAYS:
        return FALLBACK_PATHWAYS[category]
        
    return DEFAULT_PATHWAY
