import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.classify import classify_query
from app.retrieve import retrieve_chunks
from app.conflicts import check_conflicts
from app.evidence import evidence_sufficiency
from app.clarify import ask_clarifying_question
from app.generate import call_llm
from app.pathway import get_pathway
from app.cache import make_cache_key, get_cached_response, set_cached_response, get_corpus_version

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("knowyourrights-backend")

app = FastAPI(
    title="KnowYourRights RAG Backend API",
    version="1.0.0",
    description="FastAPI service for Indian labour & tenancy rights RAG pipeline"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=5, description="User's plain language situation text")
    state: str = Field(..., description="State code: TN | MH | KA")

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

def record_query_log(query_text: str, state: str, retrieved_chunk_ids: List[str], llm_response: Dict[str, Any], evidence_level: str):
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "localhost:5432/postgres" in db_url:
        return
    try:
        import psycopg2
        import json
        import uuid
        
        # Keep only valid UUIDs to prevent casting error with string fallback IDs
        valid_uuids = []
        for cid in retrieved_chunk_ids:
            try:
                valid_uuids.append(str(uuid.UUID(str(cid))))
            except (ValueError, TypeError):
                pass

        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO queries (query_text, state, retrieved_chunk_ids, llm_response, evidence_level)
                VALUES (%s, %s, %s::uuid[], %s, %s)
            """, [
                query_text,
                state,
                valid_uuids if valid_uuids else None,
                json.dumps(llm_response),
                evidence_level
            ])
            conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"Could not record query log to database: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "KnowYourRights FastAPI Backend"}

@app.post("/api/query", response_model=QueryResponse)
async def handle_query(req: QueryRequest):
    query_text = req.query.strip()
    state = req.state.upper()

    if state not in ("TN", "MH", "KA"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State must be one of: TN, MH, KA."
        )

    corpus_version = get_corpus_version()

    # Pipeline Step 1: Classify Query (runs BEFORE retrieval)
    classification = classify_query(query_text)
    category = classification.get("category")
    missing_facts = classification.get("missingFacts", [])

    # Pipeline Step 2: Response Cache Check
    cache_key = None
    if category:
        cache_key = make_cache_key(category, state, missing_facts)
        cached_response = await get_cached_response(cache_key, corpus_version)
        if cached_response:
            # Cache HIT: return directly
            return QueryResponse(**cached_response)

    # Pipeline Step 3: Retrieve Chunks (filtered by category and jurisdiction)
    chunks, rag_debug = retrieve_chunks(query_text, state, category=category, k=4)

    if not chunks:
        fallback_pathway = get_pathway(None)
        return QueryResponse(
            answer="I wasn't able to find specific legal provisions matching your situation in the current corpus. This system currently covers unpaid wages, wrongful termination, POSH complaints, and tenancy disputes. Please provide more context or rephrase your situation.",
            citations=[],
            evidence=Evidence(
                level="Low",
                reasons=["No relevant provisions found in the corpus for this query."]
            ),
            pathway=Pathway(**fallback_pathway),
            detectedCategory=None,
            ragDebug=rag_debug
        )

    # Pipeline Step 4: Check Conflicts
    conflicts = check_conflicts(category, state)
    if conflicts:
        logger.info(f"Found statutory conflicts for {category} in {state}: {conflicts}")

    # Pipeline Step 5: Evidence Sufficiency
    evidence = evidence_sufficiency(chunks, missing_facts, state, category)

    # Pipeline Step 6: Clarifying question / Low-evidence evaluation
    if evidence["level"] == "Low":
        pathway_dict = get_pathway(category)
        chunk_ids = [c.get("id", str(c.get("act"))) for c in chunks]
        low_evidence_response = {
            "answer": "Based on the details provided, there is insufficient factual information to give a conclusive legal assessment. " + (f"Please clarify: {'; '.join(missing_facts)}." if missing_facts else "Please provide more details regarding your situation."),
            "citations": [],
            "evidence": Evidence(**evidence),
            "pathway": Pathway(**pathway_dict),
            "detectedCategory": category,
            "ragDebug": rag_debug
        }
        # Low evidence response is NEVER cached
        record_query_log(query_text, state, chunk_ids, low_evidence_response, evidence["level"])
        return QueryResponse(**low_evidence_response)

    # Optional clarification question extension point (returns None if not needed)
    ask_clarifying_question(evidence, category)

    # Pipeline Step 7: Call LLM for generation
    llm_output = call_llm(query_text, state, chunks)

    # Use category from LLM or classification
    final_category = llm_output.get("detectedCategory") or category
    has_recourse = llm_output.get("hasDirectRecourse", True)
    answer_text = llm_output.get("answer", "")
    if "no direct legal recourse" in answer_text.lower() or "do not directly address" in answer_text.lower() or len(llm_output.get("citations", [])) == 0:
        has_recourse = False

    # Pipeline Step 8: Get Procedural Pathway (specific if recourse exists, otherwise DLSA/Mediation alternative)
    if has_recourse:
        pathway_dict = get_pathway(final_category)
    else:
        pathway_dict = get_pathway(None) # DLSA & Pre-Litigation Mediation
        evidence["level"] = "Low"
        if not any("No direct statutory recourse" in r for r in evidence["reasons"]):
            evidence["reasons"].insert(0, "No direct statutory recourse found in retrieved provisions for this specific scenario. Recommended next steps provide general legal aid and mediation guidance.")

    response_payload = {
        "answer": answer_text,
        "citations": llm_output.get("citations", []),
        "evidence": evidence,
        "pathway": pathway_dict,
        "detectedCategory": final_category,
        "ragDebug": rag_debug
    }

    # Save to response_cache ONLY for High/Medium evidence responses with verified recourse
    if cache_key and evidence["level"] in ("High", "Medium"):
        try:
            await set_cached_response(
                cache_key=cache_key,
                category=final_category or category or "general",
                jurisdiction=state,
                corpus_version=corpus_version,
                response=response_payload,
                evidence_level=evidence["level"]
            )
        except Exception as e:
            logger.warning(f"Failed to cache response: {e}")

    # Log query record to database
    chunk_ids = [c.get("id", str(c.get("act"))) for c in chunks]
    record_query_log(query_text, state, chunk_ids, llm_output, evidence["level"])

    return QueryResponse(
        answer=response_payload["answer"],
        citations=response_payload["citations"],
        evidence=Evidence(**evidence),
        pathway=Pathway(**pathway_dict),
        detectedCategory=final_category,
        ragDebug=rag_debug
    )
