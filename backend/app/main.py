import os
import json
import logging
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from app.classify import classify_query
from app.retrieve import retrieve_chunks
from app.conflicts import check_conflicts
from app.evidence import evidence_sufficiency
from app.clarify import ask_clarifying_question
from app.generate import call_llm
from app.pathway import get_pathway
from app.cache import make_cache_key, get_cached_response, set_cached_response, get_corpus_version
from app.cases import (
    get_case, create_case,
    update_case_awaiting, update_case_resolved, update_case_facts,
    MAX_CLARIFICATION_ROUNDS,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("knowyourrights-backend")

app = FastAPI(
    title="KnowYourRights RAG Backend API",
    version="2.0.0",
    description="FastAPI service for Indian labour & tenancy rights RAG pipeline with case persistence",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=5)
    state: str = Field(..., description="TN | MH | KA")
    case_id: Optional[str] = Field(None, description="Existing case ID for session continuity")

class Citation(BaseModel):
    act: str
    section: str
    jurisdiction: str

class Evidence(BaseModel):
    level: str
    reasons: List[str]

class PathwayStep(BaseModel):
    title: str
    detail: str
    docs: Optional[List[str]] = None

class Pathway(BaseModel):
    authority: str
    deadlineNote: str
    steps: List[PathwayStep]

class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    evidence: Evidence
    pathway: Pathway
    detectedCategory: Optional[str] = None
    ragDebug: Optional[Dict[str, Any]] = None
    # Case persistence fields (always present)
    case_id: Optional[str] = None
    # Clarification fields (only set when needsClarification=True)
    needsClarification: bool = False
    clarifyingQuestion: Optional[str] = None
    clarifyingReason: Optional[str] = None
    turnCount: Optional[int] = None
    maxTurns: int = MAX_CLARIFICATION_ROUNDS

class CaseStateResponse(BaseModel):
    case_id: str
    status: str
    original_query: str
    category: Optional[str] = None
    clarification_round: int = 0
    # Populated when status == 'awaiting_clarification'
    clarifyingQuestion: Optional[str] = None
    # Populated when status == 'resolved'
    result: Optional[Dict[str, Any]] = None

# ── Helpers ────────────────────────────────────────────────────────────────────

def record_query_log(query_text, state, retrieved_chunk_ids, llm_response, evidence_level):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return
    try:
        import psycopg2, uuid as _uuid
        valid_uuids = []
        for cid in retrieved_chunk_ids:
            try:
                valid_uuids.append(str(_uuid.UUID(str(cid))))
            except (ValueError, TypeError):
                pass
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO queries (query_text, state, retrieved_chunk_ids, llm_response, evidence_level)
                VALUES (%s, %s, %s::uuid[], %s, %s)
                """,
                [query_text, state, valid_uuids or None, json.dumps(llm_response), evidence_level],
            )
            conn.commit()
        conn.close()
    except Exception as e:
        logger.warning("Could not record query log: %s", e)


def _pick_blocking_fact(missing_facts: List[str]) -> Optional[str]:
    """Return the single most important missing fact to ask about, or None."""
    return missing_facts[0] if missing_facts else None


def _build_clarifying_question(blocking_fact: str) -> str:
    """Wrap a raw fact label into a friendly question."""
    return f"To give you a more precise answer, could you tell us: {blocking_fact}?"


# ── GET /api/case/{case_id} — restore in-progress or resolved case ─────────────

@app.get("/api/case/{case_id}", response_model=CaseStateResponse)
async def get_case_state(case_id: str):
    """
    Lightweight endpoint the frontend calls on page load (if localStorage has a case_id)
    to restore the previous session without re-running the pipeline.
    """
    row = get_case(case_id)
    if not row:
        raise HTTPException(status_code=404, detail="Case not found or expired.")
    if row.get("status") == "expired":
        raise HTTPException(status_code=410, detail="Case has expired.")

    asked_facts = row.get("asked_facts") or []
    last_asked = asked_facts[-1] if asked_facts else None
    clarifying_q = _build_clarifying_question(last_asked) if last_asked and row.get("status") == "awaiting_clarification" else None

    result = row.get("result")
    if isinstance(result, str):
        try:
            result = json.loads(result)
        except Exception:
            result = None

    return CaseStateResponse(
        case_id=str(row["case_id"]),
        status=row["status"],
        original_query=row["original_query"],
        category=row.get("category"),
        clarification_round=row.get("clarification_round", 0),
        clarifyingQuestion=clarifying_q,
        result=result,
    )


# ── GET / — health ─────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "ok", "service": "KnowYourRights FastAPI Backend", "version": "2.0.0"}


# ── POST /api/query — main pipeline ───────────────────────────────────────────

@app.post("/api/query", response_model=QueryResponse)
async def handle_query(req: QueryRequest):
    query_text = req.query.strip()
    state = req.state.upper()
    incoming_case_id = req.case_id

    if state not in ("TN", "MH", "KA"):
        raise HTTPException(status_code=400, detail="State must be one of: TN, MH, KA.")

    corpus_version = get_corpus_version()

    # ── Step 0: Load or create case ─────────────────────────────────────────
    existing_case = None
    if incoming_case_id:
        existing_case = get_case(incoming_case_id)
        # Treat expired / not-found as no case (creates a new one below)
        if existing_case and existing_case.get("status") == "expired":
            existing_case = None

    # Previously stored facts (from earlier clarification rounds)
    prior_facts: Dict[str, Any] = {}
    clarification_round: int = 0
    asked_facts: List[str] = []

    if existing_case:
        case_id = str(existing_case["case_id"])
        prior_facts = existing_case.get("facts") or {}
        if isinstance(prior_facts, str):
            prior_facts = json.loads(prior_facts)
        clarification_round = existing_case.get("clarification_round", 0)
        asked_facts_raw = existing_case.get("asked_facts") or []
        if isinstance(asked_facts_raw, str):
            asked_facts_raw = json.loads(asked_facts_raw)
        asked_facts = list(asked_facts_raw)
        logger.info("Loaded case %s (round %d, status %s)", case_id, clarification_round, existing_case.get("status"))
    else:
        # Will be created after classification so we have category
        case_id = None  # type: ignore[assignment]

    # ── Step 1: Classify query ───────────────────────────────────────────────
    classification = classify_query(query_text)
    category = classification.get("category")
    missing_facts: List[str] = classification.get("missingFacts", [])

    # Remove facts already asked in prior rounds
    missing_facts = [f for f in missing_facts if f not in asked_facts]

    # ── Create case row now that we have category ────────────────────────────
    if case_id is None:
        case_id = create_case(
            original_query=query_text,
            category=category,
            jurisdiction=state,
            facts={},
        )
        clarification_round = 0

    # ── Step 2: Response cache check ─────────────────────────────────────────
    cache_key = None
    if category:
        cache_key = make_cache_key(category, state, missing_facts)
        # IMPORTANT: cache_key is built from (category, state, missing_facts) only.
        # case_id is intentionally NOT part of the key.
        cached = await get_cached_response(cache_key, corpus_version)
        if cached:
            update_case_resolved(case_id, category, cached)
            return QueryResponse(
                **{k: v for k, v in cached.items() if k in QueryResponse.model_fields},
                case_id=case_id,
                needsClarification=False,
            )

    # ── Step 3: Retrieve chunks ──────────────────────────────────────────────
    chunks, rag_debug = retrieve_chunks(query_text, state, category=category, k=4)

    if not chunks:
        fallback_pathway = get_pathway(None)
        empty_resp = dict(
            answer="I wasn't able to find specific legal provisions matching your situation. Please provide more context or rephrase your situation.",
            citations=[],
            evidence={"level": "Low", "reasons": ["No relevant provisions found."]},
            pathway=fallback_pathway,
            detectedCategory=None,
            ragDebug=rag_debug,
        )
        update_case_resolved(case_id, category, empty_resp)
        return QueryResponse(
            answer=empty_resp["answer"],
            citations=[],
            evidence=Evidence(**empty_resp["evidence"]),
            pathway=Pathway(**empty_resp["pathway"]),
            detectedCategory=None,
            ragDebug=rag_debug,
            case_id=case_id,
        )

    # ── Step 4: Check conflicts ──────────────────────────────────────────────
    conflicts = check_conflicts(category, state)
    if conflicts:
        logger.info("Conflicts found for %s/%s: %s", category, state, conflicts)

    # ── Step 5: Evidence sufficiency ─────────────────────────────────────────
    evidence = evidence_sufficiency(chunks, missing_facts, state, category)

    # ── Step 6: Clarification gate ───────────────────────────────────────────
    # Gate: evidence is Low AND we have a blocking fact AND haven't hit the round cap
    blocking_fact = _pick_blocking_fact(missing_facts)
    should_clarify = (
        evidence["level"] == "Low"
        and blocking_fact is not None
        and clarification_round < MAX_CLARIFICATION_ROUNDS
    )

    if should_clarify:
        new_round = clarification_round + 1
        clarifying_q = _build_clarifying_question(blocking_fact)
        update_case_awaiting(
            case_id=case_id,
            clarification_round=new_round,
            asked_fact=blocking_fact,
            category=category,
            jurisdiction=state,
            facts=prior_facts,
        )
        logger.info("Case %s awaiting clarification (round %d): %s", case_id, new_round, blocking_fact)

        # Return WITHOUT calling generate.py
        fallback_pathway = get_pathway(category)
        return QueryResponse(
            answer="",  # frontend won't show this in CLARIFICATION state
            citations=[],
            evidence=Evidence(**evidence),
            pathway=Pathway(**fallback_pathway),
            detectedCategory=category,
            ragDebug=rag_debug,
            case_id=case_id,
            needsClarification=True,
            clarifyingQuestion=clarifying_q,
            clarifyingReason=f"This detail affects which specific rules apply to your situation.",
            turnCount=new_round,
            maxTurns=MAX_CLARIFICATION_ROUNDS,
        )

    # ── Step 7: Clarifying question extension point (stub) ───────────────────
    ask_clarifying_question(evidence, category)

    # ── Step 8: Generate answer ──────────────────────────────────────────────
    llm_output = call_llm(query_text, state, chunks)
    final_category = llm_output.get("detectedCategory") or category
    answer_text = llm_output.get("answer", "")
    has_recourse = llm_output.get("hasDirectRecourse", True)
    if "no direct legal recourse" in answer_text.lower() or not llm_output.get("citations"):
        has_recourse = False

    # ── Step 9: Pathway ──────────────────────────────────────────────────────
    pathway_dict = get_pathway(final_category) if has_recourse else get_pathway(None)
    if not has_recourse:
        evidence["level"] = "Low"
        if not any("No direct statutory recourse" in r for r in evidence["reasons"]):
            evidence["reasons"].insert(0, "No direct statutory recourse found in retrieved provisions.")

    response_payload = {
        "answer": answer_text,
        "citations": llm_output.get("citations", []),
        "evidence": evidence,
        "pathway": pathway_dict,
        "detectedCategory": final_category,
        "ragDebug": rag_debug,
    }

    # ── Cache High/Medium responses (never Low, never with case_id) ──────────
    if cache_key and evidence["level"] in ("High", "Medium"):
        try:
            await set_cached_response(
                cache_key=cache_key,
                category=final_category or category or "general",
                jurisdiction=state,
                corpus_version=corpus_version,
                response=response_payload,
                evidence_level=evidence["level"],
            )
        except Exception as e:
            logger.warning("Failed to cache: %s", e)

    # ── Persist resolved case ─────────────────────────────────────────────────
    update_case_resolved(case_id, final_category, response_payload)

    # ── Log query ─────────────────────────────────────────────────────────────
    chunk_ids = [c.get("id", str(c.get("act", ""))) for c in chunks]
    record_query_log(query_text, state, chunk_ids, llm_output, evidence["level"])

    return QueryResponse(
        answer=answer_text,
        citations=llm_output.get("citations", []),
        evidence=Evidence(**evidence),
        pathway=Pathway(**pathway_dict),
        detectedCategory=final_category,
        ragDebug=rag_debug,
        case_id=case_id,
        needsClarification=False,
    )
