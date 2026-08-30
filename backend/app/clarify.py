# backend/app/clarify.py

import re
from typing import Dict, Any, Optional, List
from app.fact_requirements import (
    REQUIRED_FACTS,
    QUESTION_TEMPLATES,
    REASON_TEMPLATES,
    DEFAULT_REASON,
    YES_NO_FACTS,
)

YES_PATTERNS = {"yes", "yeah", "yep", "yup", "correct", "true", "i do", "we do", "female", "woman"}
NO_PATTERNS = {"no", "nope", "nah", "false", "don't", "dont", "i don't", "we don't", "do not", "does not", "male", "man"}


def get_next_clarifying_question(category: str, missing_facts: List[str]) -> Optional[Dict[str, Any]]:
    """
    Determines the single highest priority missing fact to ask about.
    Prioritizes blocking facts first, followed by refining facts.
    """
    if not missing_facts or not category or category not in REQUIRED_FACTS:
        return None

    blocking = REQUIRED_FACTS[category]["blocking"]
    ordered = [f for f in blocking if f in missing_facts] + [
        f for f in missing_facts if f not in blocking
    ]
    if not ordered:
        return None

    next_fact = ordered[0]
    return {
        "fact_being_requested": next_fact,
        "clarifying_question": QUESTION_TEMPLATES.get(
            next_fact, f"Could you provide more details regarding: {next_fact}?"
        ),
        "reason_shown_to_user": REASON_TEMPLATES.get(next_fact, DEFAULT_REASON),
    }


def try_cheap_extraction(fact: str, user_answer: str) -> Optional[bool]:
    """
    For facts in YES_NO_FACTS, try a lightweight keyword match before
    falling back to a full classify_query re-call. Returns True/False if
    confidently resolved, None if ambiguous.
    """
    if fact not in YES_NO_FACTS:
        return None
    normalized = user_answer.strip().lower()
    words = set(re.findall(r"\b\w+\b", normalized))

    for p in NO_PATTERNS:
        if p in words or (len(p.split()) > 1 and p in normalized):
            return False

    for p in YES_PATTERNS:
        if p in words or (len(p.split()) > 1 and p in normalized):
            return True

    return None


def ask_clarifying_question(
    evidence: Dict[str, Any], category: Optional[str]
) -> Optional[str]:
    """
    Extension hook for interactive multi-turn clarification loop.
    """
    return None
