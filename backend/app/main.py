import os
import json
import logging
import asyncio
import urllib.request
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

MAX_CLARIFICATION_ROUNDS = 2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("knowyourrights-backend")

app = FastAPI(
    title="KnowYourRights RAG Backend API",
    version="2.0.0",
    description="FastAPI service for Indian labour & tenancy rights RAG pipeline",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Keep-alive self-ping background process (Prevents Render free tier sleep) ──

async def _keep_alive_ping_loop():
    await asyncio.sleep(15)  # Initial grace period on boot
    while True:
        try:
            url = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("APP_URL")
            if url:
                target_url = f"{url.rstrip('/')}/"
                def _ping():
                    req = urllib.request.Request(target_url, headers={"User-Agent": "KYR-KeepAlive/1.0"})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        return resp.getcode()

                loop = asyncio.get_event_loop()
                status_code = await loop.run_in_executor(None, _ping)
                logger.info("Keep-alive self-ping to %s returned HTTP %s", target_url, status_code)
        except Exception as e:
            logger.debug("Keep-alive self-ping note: %s", e)

        await asyncio.sleep(600)  # Ping every 10 minutes (600 seconds)

@app.on_event("startup")
def start_keep_alive_task():
    asyncio.create_task(_keep_alive_ping_loop())


# ── Pydantic models ────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=5)
    state: str = Field(..., description="TN | MH | KA")
    facts: Optional[Dict[str, Any]] = Field(default_factory=dict)
    clarification_round: int = 0
    asked_facts: Optional[List[str]] = Field(default_factory=list)
    original_query: Optional[str] = None

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
    # Clarification fields (only set when needsClarification=True)
    needsClarification: bool = False
    clarifyingQuestion: Optional[str] = None
    clarifyingReason: Optional[str] = None
    turnCount: Optional[int] = None
    maxTurns: int = MAX_CLARIFICATION_ROUNDS
    # Stateless session tracking fields
    facts: Dict[str, Any] = Field(default_factory=dict)
    clarification_round: int = 0
    asked_facts: List[str] = Field(default_factory=list)
    original_query: Optional[str] = None

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


# ── GET / — health ─────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "ok", "service": "KnowYourRights FastAPI Backend", "version": "2.0.0"}


# ── POST /api/query — main pipeline ───────────────────────────────────────────

@app.post("/api/query", response_model=QueryResponse)
async def handle_query(req: QueryRequest):
    query_text = req.query.strip()
    state = req.state.upper()
    prior_facts: Dict[str, Any] = dict(req.facts or {})
    clarification_round: int = req.clarification_round
    asked_facts: List[str] = list(req.asked_facts or [])
    original_query: str = req.original_query or query_text

    if state not in ("TN", "MH", "KA"):
        raise HTTPException(status_code=400, detail="State must be one of: TN, MH, KA.")

    corpus_version = get_corpus_version()

    # ── Step 1: Classify query & handle clarification answers ────────────────
    if asked_facts and len(asked_facts) == clarification_round and clarification_round > 0:
        most_recent_asked_fact = asked_facts[-1]
        resolved_via_cheap = False

        if most_recent_asked_fact in YES_NO_FACTS:
            cheap_val = try_cheap_extraction(most_recent_asked_fact, query_text)
            if cheap_val is not None:
                prior_facts[most_recent_asked_fact] = cheap_val
                resolved_via_cheap = True

        if not resolved_via_cheap:
            prior_facts[most_recent_asked_fact] = query_text

        combined_text = f"{original_query} [Additional context: {query_text}]"
        classification = classify_query(combined_text, known_facts=prior_facts)
        category = classification.get("category")
    else:
        classification = classify_query(query_text, known_facts=prior_facts)
        category = classification.get("category")

    missing_facts: List[str] = classification.get("missingFacts", [])
    missing_facts = [f for f in missing_facts if f not in asked_facts]

    # ── Step 2: Response cache check (fresh queries only) ───────────────────
    cache_key = None
    if category and not prior_facts and clarification_round == 0:
        cache_key = make_cache_key(category, state, missing_facts)
        cached = await get_cached_response(cache_key, corpus_version)
        if cached:
            return QueryResponse(
                **{k: v for k, v in cached.items() if k in QueryResponse.model_fields},
                needsClarification=False,
                facts=prior_facts,
                clarification_round=clarification_round,
                asked_facts=asked_facts,
                original_query=original_query,
            )

    # ── Step 3: Retrieve chunks ──────────────────────────────────────────────
    retrieve_query = original_query if not asked_facts else f"{original_query} {query_text}"
    chunks, rag_debug = retrieve_chunks(retrieve_query, state, category=category, k=4)

    if not chunks:
        fallback_pathway = get_pathway(None)
        return QueryResponse(
            answer="I wasn't able to find specific legal provisions matching your situation. Please provide more context or rephrase your situation.",
            citations=[],
            evidence=Evidence(level="Low", reasons=["No relevant provisions found."]),
            pathway=Pathway(**fallback_pathway),
            detectedCategory=None,
            ragDebug=rag_debug,
            needsClarification=False,
            facts=prior_facts,
            clarification_round=clarification_round,
            asked_facts=asked_facts,
            original_query=original_query,
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
            new_asked_facts = list(asked_facts) + [asked_fact]

            fallback_pathway = get_pathway(category)
            return QueryResponse(
                answer="",
                citations=[],
                evidence=Evidence(**evidence),
                pathway=Pathway(**fallback_pathway),
                detectedCategory=category,
                ragDebug=rag_debug,
                needsClarification=True,
                clarifyingQuestion=next_question_dict["clarifying_question"],
                clarifyingReason=next_question_dict["reason_shown_to_user"],
                turnCount=new_round,
                maxTurns=MAX_CLARIFICATION_ROUNDS,
                facts=prior_facts,
                clarification_round=new_round,
                asked_facts=new_asked_facts,
                original_query=original_query,
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

    # ── Step 10: Log query ───────────────────────────────────────────────────
    chunk_ids = [c.get("id", str(c.get("act", ""))) for c in chunks]
    record_query_log(retrieve_query, state, chunk_ids, llm_output, evidence["level"])

    return QueryResponse(
        answer=answer_text,
        citations=llm_output.get("citations", []),
        evidence=Evidence(**evidence),
        pathway=Pathway(**pathway_dict),
        detectedCategory=final_category,
        ragDebug=rag_debug,
        needsClarification=False,
        facts=prior_facts,
        clarification_round=clarification_round,
        asked_facts=asked_facts,
        original_query=original_query,
    )
