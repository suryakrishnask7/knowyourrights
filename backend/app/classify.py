# backend/app/classify.py

import os
import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq
from app.fact_requirements import REQUIRED_FACTS

logger = logging.getLogger(__name__)

VALID_CATEGORIES = list(REQUIRED_FACTS.keys())


def build_classify_prompt(known_facts: Optional[dict] = None) -> str:
    known_facts = known_facts or {}
    allowed_keys_block = "\n".join(
        f"- {cat}: {', '.join(req['blocking'] + req['refining'])}"
        for cat, req in REQUIRED_FACTS.items()
    )
    return f"""You are an expert legal classifier for Indian labour rights, workplace protections, and tenancy disputes.
Classify the user's query into EXACTLY ONE of the allowed category keys.

Return JSON only:
{{
  "category": "<one of: {', '.join(REQUIRED_FACTS.keys())} or null if general/unsupported>",
  "missingFacts": ["<zero or more keys, ONLY from the allowed list below for the detected category>"]
}}

Allowed missingFacts keys per category:
{allowed_keys_block}

Only include a key in missingFacts if it is genuinely absent from the query
AND from any facts already known: {json.dumps(known_facts)}. Never invent a
key outside the allowed list for the detected category."""


def extract_json_from_llm(raw_text: str) -> dict:
    import re, json
    cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    start_idx = cleaned.find("{")
    if start_idx != -1:
        try:
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(cleaned[start_idx:])
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass
    return json.loads(cleaned)


def _classify_heuristic(query_text: str, known_facts: Optional[dict] = None) -> Dict[str, Any]:
    """Deterministic rule-based keyword classifier as primary fallback."""
    known_facts = known_facts or {}
    q_lower = query_text.lower()
    cat: Optional[str] = None
    missing: List[str] = []

    # Priority order matching for specific disputes
    if any(w in q_lower for w in ["pf", "provident fund", "epfo", "uan", "passbook"]):
        cat = "pf_nonpayment"
    elif any(w in q_lower for w in ["gratuity", "5 years", "service completion", "retirement dues"]):
        cat = "gratuity_nonpayment"
    elif any(w in q_lower for w in ["bonus", "diwali bonus", "annual bonus", "8.33%"]):
        cat = "bonus_nonpayment"
    elif any(w in q_lower for w in ["maternity", "pregnant", "pregnancy", "creche", "delivery", "miscarriage"]):
        cat = "maternity_benefit"
    elif any(w in q_lower for w in ["overtime", "extra hours", "double pay", "48 hours", "9 hours", "late night"]):
        cat = "overtime_hours"
    elif any(w in q_lower for w in ["deposit", "advance", "refund deposit", "security advance", "security deposit"]):
        cat = "security_deposit_dispute"
    elif any(w in q_lower for w in ["evict", "eviction", "vacate", "throw out", "forceful possession", "lockout"]):
        cat = "eviction_dispute"
    elif any(w in q_lower for w in ["increase rent", "rent hike", "revision", "escalation", "higher rent"]):
        cat = "rent_increase_dispute"
    elif any(w in q_lower for w in ["repair", "maintenance", "seepage", "leakage", "whitewash", "painting"]):
        cat = "repairs_maintenance_dispute"
    elif any(w in q_lower for w in ["posh", "sexual harass", "sexual advance", "sexual assault", "internal complaints committee"]):
        cat = "posh_complaint"
    elif any(w in q_lower for w in ["fire", "fired", "terminat", "retrench", "dismiss", "resign", "notice period", "severance"]):
        cat = "wrongful_termination"
    elif any(w in q_lower for w in ["salary", "wage", "unpaid", "due", "pay", "deduction", "delayed", "stipend"]):
        cat = "unpaid_wages"
    elif any(w in q_lower for w in ["rent", "landlord", "tenant", "lease", "agreement"]):
        cat = "tenant_landlord"

    if cat and cat in REQUIRED_FACTS:
        allowed = REQUIRED_FACTS[cat]["blocking"] + REQUIRED_FACTS[cat]["refining"]
        missing = [f for f in allowed if f not in known_facts]

    return {"category": cat, "missingFacts": missing}


def classify_query(query_text: str, known_facts: Optional[dict] = None) -> Dict[str, Any]:
    known_facts = known_facts or {}
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("mock_"):
        return _classify_heuristic(query_text, known_facts)

    try:
        client = Groq(api_key=api_key)
        system_prompt = build_classify_prompt(known_facts)
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            max_tokens=500,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Query: \"{query_text}\""}
            ],
        )
        raw_content = response.choices[0].message.content or "{}"
        data = extract_json_from_llm(raw_content)
        cat = data.get("category")
        if cat not in VALID_CATEGORIES:
            cat = None

        raw_missing = data.get("missingFacts", [])
        filtered_missing: List[str] = []
        if cat and cat in REQUIRED_FACTS:
            allowed = set(REQUIRED_FACTS[cat]["blocking"] + REQUIRED_FACTS[cat]["refining"])
            filtered_missing = [f for f in raw_missing if f in allowed and f not in known_facts]

        # If LLM classified successfully
        if cat is not None:
            return {
                "category": cat,
                "missingFacts": filtered_missing
            }

        # If LLM returned None, double check heuristic before declaring unsupported
        heuristic_res = _classify_heuristic(query_text, known_facts)
        if heuristic_res.get("category"):
            logger.info("LLM returned None, but heuristic matched category %s", heuristic_res["category"])
            return heuristic_res

        return {
            "category": None,
            "missingFacts": []
        }
    except Exception as e:
        logger.warning(f"Classification LLM exception: {e}. Executing graceful heuristic fallback.")
        # Graceful fallback to heuristic classification
        heuristic_res = _classify_heuristic(query_text, known_facts)
        if heuristic_res.get("category"):
            return heuristic_res
        
        # Truly failed with exception and heuristic found nothing
        return {
            "category": None,
            "missingFacts": [],
            "error": True,
            "error_message": str(e)
        }

