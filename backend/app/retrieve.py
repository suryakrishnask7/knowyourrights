import os
import re
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

SHORT_ALLOWLIST = {"pf", "ic", "id", "tn", "mh", "ka"}

SYNONYM_MAPPINGS: Dict[str, List[str]] = {
    "fire": ["retrenchment", "dismissal", "termination", "discharge", "notice in writing", "retrenched", "section 25f"],
    "fired": ["retrenchment", "dismissal", "termination", "discharge", "notice in writing", "retrenched", "section 25f"],
    "terminated": ["retrenchment", "dismissal", "termination", "continuous service", "severance", "section 25f"],
    "kicked out": ["eviction", "recovery of possession", "vacate", "summary eviction", "lockout"],
    "thrown out": ["eviction", "recovery of possession", "vacate", "summary eviction", "lockout"],
    "evict": ["eviction", "recovery of possession", "vacate notice", "rent authority"],
    "deposit": ["security deposit", "advance", "refund", "withholding", "deduction"],
    "salary": ["wages", "remuneration", "unpaid wages", "payment of wages", "delayed payment", "wage period"],
    "deducted": ["unauthorized deduction", "deduction", "withheld"],
    "harass": ["sexual harassment", "internal committee", "hostile environment", "inquiry"],
    "pregnant": ["maternity benefit", "maternity leave", "medical bonus", "nursing breaks"],
    "maternity": ["maternity benefit", "maternity leave", "medical bonus", "nursing breaks"],
}

CATEGORY_SYNONYMS: Dict[str, List[str]] = {
    "wrongful_termination": ["retrenchment", "dismissal", "termination", "continuous service", "compensation", "notice period", "shops and establishments"],
    "unpaid_wages": ["wages", "salary", "delayed", "payment of wages", "wage period", "deduction", "shops and establishments"],
    "security_deposit_dispute": ["security deposit", "advance", "refund", "deductions", "vacation"],
    "eviction_dispute": ["eviction", "recovery of possession", "rent authority", "notice to vacate"],
    "posh_complaint": ["sexual harassment", "internal committee", "icc", "complaint", "inquiry"],
    "maternity_benefit": ["maternity benefit", "leave", "confinement", "medical bonus", "prohibition of dismissal"],
    "pf_nonpayment": ["provident fund", "epf", "epfo", "deposit", "contributions"],
    "gratuity_nonpayment": ["gratuity", "continuous service", "5 years", "separation", "payment of gratuity"],
    "bonus_nonpayment": ["annual bonus", "statutory bonus", "8.33 percent", "disbursement"],
    "overtime_hours": ["overtime", "double rate", "daily hours", "weekly hours", "excess work"],
}


def tokenize(text: str) -> List[str]:
    """Tokenize text while retaining short allowlisted tokens like 'pf', 'ic', 'id'."""
    clean = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    tokens = clean.split()
    return [t for t in tokens if len(t) > 2 or t in SHORT_ALLOWLIST]


def expand_query_tokens(query: str, category: Optional[str] = None) -> List[str]:
    """Expands plain-language user phrases with formal legal statutory terminology."""
    base_tokens = tokenize(query)
    expanded = set(base_tokens)
    q_lower = query.lower()

    for phrase, syns in SYNONYM_MAPPINGS.items():
        if phrase in q_lower:
            for s in syns:
                expanded.update(tokenize(s))

    if category and category in CATEGORY_SYNONYMS:
        for s in CATEGORY_SYNONYMS[category]:
            expanded.update(tokenize(s))

    return list(expanded)


def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url and "postgres:postgres" in db_url:
        return None
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor, connect_timeout=5)
        return conn
    except Exception as e:
        logger.warning(f"Could not connect to Supabase Postgres: {e}")
        return None


def _load_local_json_corpus() -> List[Dict[str, Any]]:
    """Loads full legal chunks corpus from data/legal_chunks.json."""
    try:
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "legal_chunks.json")
        if os.path.exists(data_path):
            with open(data_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning("Could not read data/legal_chunks.json: %s", e)
    from app.corpus_fallback import FALLBACK_CORPUS
    return FALLBACK_CORPUS


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
    query_tokens = expand_query_tokens(query, category)
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

    # Fallback to full local JSON corpus if DB returned no chunks or connection wasn't available
    if not chunks:
        all_local = _load_local_json_corpus()
        chunks = [
            {
                "id": c.get("id"),
                "domain": c.get("domain", "labour"),
                "jurisdiction": c.get("jurisdiction", "central"),
                "act": c.get("act_name", c.get("act", "")),
                "section": c.get("section", ""),
                "category": c.get("category", ""),
                "text": c.get("text", ""),
                "keywords": c.get("keywords", []),
                "binding": c.get("binding")
            }
            for c in all_local
            if c.get("jurisdiction") in ("central", state)
            and (not target_domain or c.get("domain", "labour") == target_domain)
            and (not category or c.get("category") == category)
        ]
        if not chunks:
            chunks = [
                {
                    "id": c.get("id"),
                    "domain": c.get("domain", "labour"),
                    "jurisdiction": c.get("jurisdiction", "central"),
                    "act": c.get("act_name", c.get("act", "")),
                    "section": c.get("section", ""),
                    "category": c.get("category", ""),
                    "text": c.get("text", ""),
                    "keywords": c.get("keywords", []),
                    "binding": c.get("binding")
                }
                for c in all_local
                if c.get("jurisdiction") in ("central", state)
            ]

    # Tag Model Tenancy Act chunks appropriately for states with enacted tenancy acts
    for chunk in chunks:
        act_title = chunk.get("act", "")
        if "Model Tenancy" in act_title:
            chunk["is_model_law"] = True
            if state in ("TN", "MH", "KA"):
                chunk["binding"] = False

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
        
        # Priority bonus for state-specific provisions in target jurisdiction
        state_bonus = 1 if chunk.get("jurisdiction") == state else 0
        
        # Deprioritize non-binding model tenancy law when state has enacted statutes
        binding_penalty = -2 if chunk.get("binding") is False else 0

        score = len(kw_matches) * 2 + len(txt_matches) + cat_bonus + state_bonus + binding_penalty
        score = max(score, 0)
        
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

