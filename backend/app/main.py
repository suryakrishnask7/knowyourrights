import os
import json
import logging
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from app.fact_requirements import (
    REQUIRED_FACTS,
    QUESTION_TEMPLATES,
    REASON_TEMPLATES,
    DEFAULT_REASON,
    YES_NO_FACTS,
)
from app.classify import classify_query
from app.retrieve import retrieve_chunks
from app.conflicts import check_conflicts
from app.evidence import evidence_sufficiency
from app.clarify import get_next_clarifying_question, try_cheap_extraction
from app.generate import call_llm
from app.pathway import get_pathway
from app.cache import make_cache_key, get_cached_response, set_cached_response, get_corpus_version
from app.cases import (
    get_case, create_case,
    update_case_awaiting, update_case_resolved, update_case_facts, reset_case_facts,
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
    if not db_url or "localhost:5432/postgres" in db_url:
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
    if isinstance(asked_facts, str):
        try:
            asked_facts = json.loads(asked_facts)
        except Exception:
            asked_facts = []

    last_asked = asked_facts[-1] if asked_facts else None
    clarifying_q = None
    if last_asked and row.get("status") == "awaiting_clarification":
        clarifying_q = QUESTION_TEMPLATES.get(
            last_asked, f"To give you a more precise answer, could you tell us: {last_asked}?"
        )

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

    # ── Step 0: Load existing case if case_id provided ───────────────────────
    existing_case = None
    if incoming_case_id:
        existing_case = get_case(incoming_case_id)
        if existing_case and existing_case.get("status") == "expired":
            existing_case = None

    prior_facts: Dict[str, Any] = {}
    clarification_round: int = 0
    asked_facts: List[str] = []
    case_id: Optional[str] = None
    original_query: str = query_text
    is_answering_clarification = False

    if existing_case:
        case_id = str(existing_case["case_id"])
        original_query = existing_case.get("original_query", query_text)
        prior_facts = existing_case.get("facts") or {}
        if isinstance(prior_facts, str):
            try:
                prior_facts = json.loads(prior_facts)
            except Exception:
                prior_facts = {}

        clarification_round = existing_case.get("clarification_round", 0)
        asked_facts_raw = existing_case.get("asked_facts") or []
        if isinstance(asked_facts_raw, str):
            try:
                asked_facts_raw = json.loads(asked_facts_raw)
            except Exception:
                asked_facts_raw = []
        asked_facts = list(asked_facts_raw)

        if existing_case.get("status") == "awaiting_clarification" and asked_facts:
            is_answering_clarification = True

        logger.info(
            "Loaded case %s (round %d, status %s)",
            case_id,
            clarification_round,
            existing_case.get("status"),
        )

    # ── Step 1: Classify query & handle clarification answers ────────────────
    if is_answering_clarification and case_id:
        most_recent_asked_fact = asked_facts[-1]
        resolved_via_cheap = False

        if most_recent_asked_fact in YES_NO_FACTS:
            cheap_val = try_cheap_extraction(most_recent_asked_fact, query_text)
            if cheap_val is not None:
                prior_facts[most_recent_asked_fact] = cheap_val
                update_case_facts(case_id, {most_recent_asked_fact: cheap_val})
                resolved_via_cheap = True

        if not resolved_via_cheap:
            prior_facts[most_recent_asked_fact] = query_text
            update_case_facts(case_id, {most_recent_asked_fact: query_text})

        combined_text = f"{original_query} [Additional context: {query_text}]"
        classification = classify_query(combined_text, known_facts=prior_facts)
        category = classification.get("category")

        # Topic drift check: if user answered with a completely different issue
        old_category = existing_case.get("category") if existing_case else None
        if category and old_category and category != old_category:
            logger.info("Topic drift detected: %s -> %s. Resetting facts.", old_category, category)
            prior_facts = {}
            reset_case_facts(case_id, category)
            classification = classify_query(combined_text, known_facts={})
            category = classification.get("category")
    else:
        classification = classify_query(query_text, known_facts=prior_facts)
        category = classification.get("category")

    # Create case if new
    if case_id is None:
        case_id = create_case(
            original_query=query_text,
            category=category,
            jurisdiction=state,
            facts=prior_facts,
        )
        clarification_round = 0

    missing_facts: List[str] = classification.get("missingFacts", [])
    # Remove facts that have already been asked
    missing_facts = [f for f in missing_facts if f not in asked_facts]

    # ── Step 2: Response cache check (fresh queries only) ───────────────────
    cache_key = None
    if category and not prior_facts and clarification_round == 0:
        cache_key = make_cache_key(category, state, missing_facts)
        cached = await get_cached_response(cache_key, corpus_version)
        if cached:
            update_case_resolved(case_id, category, cached)
            return QueryResponse(
                **{k: v for k, v in cached.items() if k in QueryResponse.model_fields},
                case_id=case_id,
                needsClarification=False,
            )

    # ── Step 3: Retrieve chunks ──────────────────────────────────────────────
    retrieve_query = original_query if not is_answering_clarification else f"{original_query} {query_text}"
    chunks, rag_debug = retrieve_chunks(retrieve_query, state, category=category, k=4)

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

    # ── Step 5: Evidence sufficiency (hard gate on blocking facts) ───────────
    evidence = evidence_sufficiency(chunks, missing_facts, state, category)

    # ── Step 6: Clarification gate ───────────────────────────────────────────
    should_clarify = (
        evidence["level"] == "Low"
        and len(missing_facts) > 0
        and clarification_round < MAX_CLARIFICATION_ROUNDS
    )

    if should_clarify and category:
        next_question_dict = get_next_clarifying_question(category, missing_facts)
        if next_question_dict:
            new_round = clarification_round + 1
            asked_fact = next_question_dict["fact_being_requested"]
            update_case_awaiting(
                case_id=case_id,
                clarification_round=new_round,
                asked_fact=asked_fact,
                category=category,
                jurisdiction=state,
                facts=prior_facts,
            )
            logger.info("Case %s awaiting clarification (round %d): %s", case_id, new_round, asked_fact)

            fallback_pathway = get_pathway(category)
            return QueryResponse(
                answer="",  # UI handles CLARIFICATION view using clarifyingQuestion
                citations=[],
                evidence=Evidence(**evidence),
                pathway=Pathway(**fallback_pathway),
                detectedCategory=category,
                ragDebug=rag_debug,
                case_id=case_id,
                needsClarification=True,
                clarifyingQuestion=next_question_dict["clarifying_question"],
                clarifyingReason=next_question_dict["reason_shown_to_user"],
                turnCount=new_round,
                maxTurns=MAX_CLARIFICATION_ROUNDS,
            )

    # ── Step 7: Generate answer ──────────────────────────────────────────────
    llm_output = call_llm(retrieve_query, state, chunks)
    final_category = llm_output.get("detectedCategory") or category
    answer_text = llm_output.get("answer", "")
    has_recourse = llm_output.get("hasDirectRecourse", True)
    if "no direct legal recourse" in answer_text.lower() or not llm_output.get("citations"):
        has_recourse = False

    # Cap-out handling: if evidence is still Low after 2 rounds, flag unresolved gaps clearly
    if evidence["level"] == "Low" and missing_facts:
        missing_str = ", ".join(missing_facts)
        if "missing" not in answer_text.lower() and "unresolved" not in answer_text.lower():
            answer_text += f"\n\nNote: This legal summary is based on available facts. Unresolved details ({missing_str}) may affect the exact statutory remedies available."

    # ── Step 8: Pathway ──────────────────────────────────────────────────────
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

    # ── Step 9: Cache High/Medium responses ──────────────────────────────────
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

    # ── Step 10: Persist resolved case ───────────────────────────────────────
    update_case_resolved(case_id, final_category, response_payload)

    # ── Step 11: Log query ───────────────────────────────────────────────────
    chunk_ids = [c.get("id", str(c.get("act", ""))) for c in chunks]
    record_query_log(retrieve_query, state, chunk_ids, llm_output, evidence["level"])

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
