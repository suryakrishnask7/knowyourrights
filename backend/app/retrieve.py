import os
import re
import logging
from typing import List, Dict, Any, Tuple, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

SHORT_ALLOWLIST = {"pf", "ic", "id"}

def tokenize(text: str) -> List[str]:
    """Tokenize text while retaining short allowlisted tokens like 'pf', 'ic', 'id'."""
    clean = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    tokens = clean.split()
    return [t for t in tokens if len(t) > 2 or t in SHORT_ALLOWLIST]

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url and "postgres:postgres" in db_url:
        return None
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        logger.warning(f"Could not connect to Supabase Postgres: {e}")
        return None

LABOUR_CATEGORIES = {
    "unpaid_wages", "wrongful_termination", "posh_complaint", "pf_nonpayment",
    "bonus_nonpayment", "gratuity_nonpayment", "maternity_benefit", "overtime_hours"
}
TENANCY_CATEGORIES = {
    "tenant_landlord", "eviction_dispute", "security_deposit_dispute",
    "rent_increase_dispute", "repairs_maintenance_dispute"
}

def retrieve_chunks(
    query: str,
    state: str,
    category: Optional[str] = None,
    k: int = 4
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Retrieve legal chunks filtered by jurisdiction AND category/domain,
    preventing cross-domain leakage (e.g. Tenancy chunks in Labour queries).
    """
    query_tokens = tokenize(query)
    conn = get_db_connection()
    chunks: List[Dict[str, Any]] = []

    # Determine domain if category is known
    target_domain = None
    if category in LABOUR_CATEGORIES:
        target_domain = "labour"
    elif category in TENANCY_CATEGORIES:
        target_domain = "tenancy"
    
    if conn:
        try:
            with conn.cursor() as cur:
                # Query chunks from Supabase legal_chunks table with domain & category filters
                query_sql = """
                    SELECT id, domain, jurisdiction, act_name as act, section, category, text
                    FROM legal_chunks
                    WHERE jurisdiction IN ('central', %s)
                """
                params = [state]
                if target_domain:
                    query_sql += " AND domain = %s"
                    params.append(target_domain)
                if category:
                    query_sql += " AND category = %s"
                    params.append(category)
                    
                cur.execute(query_sql, params)
                rows = cur.fetchall()
                chunks = [dict(row) for row in rows]
                
                # If specific category filter returned 0 chunks, fallback within the same domain
                if len(chunks) == 0 and target_domain:
                    cur.execute("""
                        SELECT id, domain, jurisdiction, act_name as act, section, category, text
                        FROM legal_chunks
                        WHERE jurisdiction IN ('central', %s) AND domain = %s
                    """, [state, target_domain])
                    chunks = [dict(row) for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error executing Postgres query: {e}")
        finally:
            conn.close()

    # Fallback to local corpus data if DB returns no chunks or connection wasn't available
    if not chunks:
        from app.corpus_fallback import FALLBACK_CORPUS
        chunks = [
            c for c in FALLBACK_CORPUS
            if c["jurisdiction"] in ("central", state)
            and (not category or c.get("category") == category)
        ]
        if not chunks:
            chunks = [c for c in FALLBACK_CORPUS if c["jurisdiction"] in ("central", state)]

    # Score chunks based on keyword and text token match
    scored_items = []
    for chunk in chunks:
        text_tokens = tokenize(chunk["text"])
        kw_list = chunk.get("keywords", [])
        
        kw_matches = [
            kw for kw in kw_list
            if any(qt in kw.lower() or kw.lower() in qt for qt in query_tokens)
        ]
        txt_matches = [
            qt for qt in query_tokens
            if any(qt in tt or tt in qt for tt in text_tokens)
        ]
        
        # Priority bonus if chunk category matches classified category
        cat_bonus = 2 if category and chunk["category"] == category else 0
        score = len(kw_matches) * 2 + len(txt_matches) + cat_bonus
        
        scored_items.append({
            "chunk": chunk,
            "score": score,
            "kwMatches": kw_matches,
            "txtMatches": txt_matches
        })

    # Sort candidates by score descending
    with_scores = [x for x in scored_items if x["score"] > 0]
    with_scores.sort(key=lambda x: x["score"], reverse=True)
    top_k = with_scores[:k]
    
    top_k_ids = {f"{x['chunk']['act']}|{x['chunk']['section']}" for x in top_k}
    
    all_scored_debug = [
        {
            "act": x["chunk"]["act"],
            "section": x["chunk"]["section"],
            "jurisdiction": x["chunk"]["jurisdiction"],
            "category": x["chunk"]["category"],
            "score": x["score"],
            "keywordMatches": x["kwMatches"],
            "textMatches": x["txtMatches"],
            "textPreview": x["chunk"]["text"][:200],
            "selected": f"{x['chunk']['act']}|{x['chunk']['section']}" in top_k_ids
        }
        for x in with_scores
    ]

    selected_chunks = [
        {**x["chunk"], "score": x["score"]}
        for x in top_k
    ]

    total_in_corpus = len(chunks)
    rag_debug = {
        "queryTokens": query_tokens,
        "totalInCorpus": total_in_corpus,
        "filteredByJurisdiction": len(chunks),
        "allScored": all_scored_debug
    }

    return selected_chunks, rag_debug
