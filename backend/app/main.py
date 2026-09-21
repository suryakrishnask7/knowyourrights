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
from app.letter import LetterFields, is_letter_eligible, render_letter

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
    user_name: Optional[str] = None

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
    answerSimple: Optional[str] = None
    citations: List[Citation]
    evidence: Evidence
    pathway: Pathway
    detectedCategory: Optional[str] = None
    ragDebug: Optional[Dict[str, Any]] = None
    hasDirectRecourse: bool = True
    letterEligible: bool = False
    user_name: Optional[str] = None
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

class LetterRenderRequest(BaseModel):
    category: str
    act: str
    section: str
    authority: str
    ask_text: str
    fields: LetterFields
    today_str: Optional[str] = None

class LetterRenderResponse(BaseModel):
    text: str
    html: str


# ── Personalization Helpers ───────────────────────────────────────────────────

def personalize_text(text: str, user_name: Optional[str]) -> str:
    if not user_name or not user_name.strip() or not text:
        return text
    clean_name = user_name.strip().split()[0].title()
    lower_text = text.lower()
    if lower_text.startswith(f"hi {clean_name.lower()}") or lower_text.startswith(f"hello {clean_name.lower()}"):
        return text
    return f"Hi {clean_name}, here is what applies to your situation:\n\n{text}"

def personalize_simple_text(text: str, user_name: Optional[str]) -> str:
    if not user_name or not user_name.strip() or not text:
        return text
    clean_name = user_name.strip().split()[0].title()
    lower_text = text.lower()
    if lower_text.startswith(f"hi {clean_name.lower()}") or lower_text.startswith(f"hello {clean_name.lower()}"):
        return text
    return f"Hi {clean_name}, in simple terms:\n\n{text}"

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
    user_name: Optional[str] = req.user_name.strip() if req.user_name and req.user_name.strip() else None

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
    missing_facts = [f for f in missing_facts if f not in asked_facts and f not in prior_facts]

    # ── Step 2: Response cache check (fresh queries only) ───────────────────
    cache_key = None
    if category and not prior_facts and clarification_round == 0:
        cache_key = make_cache_key(category, state, missing_facts)
        cached = await get_cached_response(cache_key, corpus_version)
        if cached:
            cached_ans = cached.get("answer", "")
            cached_simple = cached.get("answerSimple") or cached_ans
            cached_recourse = cached.get("hasDirectRecourse", True)
            cached_cits = cached.get("citations", [])
            cached_ev = cached.get("evidence", {})
            cached_ev_lvl = cached_ev.get("level") if isinstance(cached_ev, dict) else getattr(cached_ev, "level", "Medium")
            letter_eligible = cached.get("letterEligible")
            if letter_eligible is None:
                letter_eligible = is_letter_eligible(
                    status="resolved",
                    has_direct_recourse=cached_recourse,
                    category=cached.get("detectedCategory"),
                    citations=cached_cits,
                    evidence_level=cached_ev_lvl
                )

            return QueryResponse(
                answer=personalize_text(cached_ans, user_name),
                answerSimple=personalize_simple_text(cached_simple, user_name),
                citations=cached_cits,
                evidence=Evidence(**cached["evidence"]),
                pathway=Pathway(**cached["pathway"]),
                detectedCategory=cached.get("detectedCategory"),
                ragDebug=cached.get("ragDebug"),
                hasDirectRecourse=cached_recourse,
                letterEligible=letter_eligible,
                user_name=user_name,
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
        fallback_msg = "I wasn't able to find specific legal provisions matching your situation. Please provide more context or rephrase your situation."
        return QueryResponse(
            answer=personalize_text(fallback_msg, user_name),
            answerSimple=personalize_simple_text(fallback_msg, user_name),
            citations=[],
            evidence=Evidence(level="Low", reasons=["No relevant provisions found."]),
            pathway=Pathway(**fallback_pathway),
            detectedCategory=None,
            ragDebug=rag_debug,
            hasDirectRecourse=False,
            letterEligible=False,
            user_name=user_name,
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
                answerSimple="",
                citations=[],
                evidence=Evidence(**evidence),
                pathway=Pathway(**fallback_pathway),
                detectedCategory=category,
                ragDebug=rag_debug,
                hasDirectRecourse=True,
                letterEligible=False,
                user_name=user_name,
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
    # Core generation is unpersonalized to maintain cache purity
    llm_output = call_llm(retrieve_query, state, chunks, user_name=None)
    final_category = llm_output.get("detectedCategory") or category
    raw_answer = llm_output.get("answer", "")
    raw_simple = llm_output.get("answerSimple") or raw_answer
    has_recourse = llm_output.get("hasDirectRecourse", True)
    if "no direct legal recourse" in raw_answer.lower() or not llm_output.get("citations"):
        has_recourse = False

    # Low confidence & out-of-scope formatting
    if evidence["level"] == "Low" or not has_recourse:
        missing_str = ", ".join(missing_facts) if missing_facts else "specific statutory preconditions"
        if "OUT OF SCOPE" not in raw_answer and "LOW DIRECT STATUTORY CONFIDENCE" not in raw_answer:
            raw_answer += f"\n\n[OUT OF SCOPE / LOW DIRECT STATUTORY CONFIDENCE]\nKnowYourRights Advisory: This query currently has low direct statutory evidence or falls outside standard statutory provisions. Unresolved facts ({missing_str}) may limit direct recourse. We recommend examining relevant Indian statutes (such as the Payment of Wages Act, Code on Wages, Industrial Disputes Act, POSH Act, or State Rent Control Act) or approaching the Labour Commissioner, Rent Controller Court, or District Legal Services Authority (DLSA)."
        if "OUT OF SCOPE" not in raw_simple and "LOW DIRECT STATUTORY CONFIDENCE" not in raw_simple:
            raw_simple += f"\n\nNote: This issue falls outside standard statutory provisions or lacks direct statutory grounding."

    # ── Step 8: Pathway & Letter Eligibility ─────────────────────────────────
    pathway_dict = get_pathway(final_category) if has_recourse else get_pathway(None)
    if not has_recourse:
        evidence["level"] = "Low"
        if not any("No direct statutory recourse" in r for r in evidence["reasons"]):
            evidence["reasons"].insert(0, "No direct statutory recourse found in retrieved provisions.")

    letter_eligible = is_letter_eligible(
        status="resolved",
        has_direct_recourse=has_recourse,
        category=final_category,
        citations=llm_output.get("citations", []),
        evidence_level=evidence["level"]
    )

    response_payload = {
        "answer": raw_answer,
        "answerSimple": raw_simple,
        "citations": llm_output.get("citations", []),
        "evidence": evidence,
        "pathway": pathway_dict,
        "detectedCategory": final_category,
        "ragDebug": rag_debug,
        "hasDirectRecourse": has_recourse,
        "letterEligible": letter_eligible,
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
        answer=personalize_text(raw_answer, user_name),
        answerSimple=personalize_simple_text(raw_simple, user_name),
        citations=llm_output.get("citations", []),
        evidence=Evidence(**evidence),
        pathway=Pathway(**pathway_dict),
        detectedCategory=final_category,
        ragDebug=rag_debug,
        hasDirectRecourse=has_recourse,
        letterEligible=letter_eligible,
        user_name=user_name,
        needsClarification=False,
        facts=prior_facts,
        clarification_round=clarification_round,
        asked_facts=asked_facts,
        original_query=original_query,
    )


# ── POST /api/letter/render — Notice letter generation ─────────────────────────

@app.post("/api/letter/render", response_model=LetterRenderResponse)
def handle_letter_render(req: LetterRenderRequest):
    rendered = render_letter(
        category=req.category,
        act=req.act,
        section=req.section,
        authority=req.authority,
        ask_text=req.ask_text,
        fields=req.fields,
        today_str=req.today_str
    )
    return LetterRenderResponse(text=rendered["text"], html=rendered["html"])

