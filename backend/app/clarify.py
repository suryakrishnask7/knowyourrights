# backend/app/clarify.py

import re
from typing import Dict, Any, Optional, List
from app.fact_requirements import (
    REQUIRED_FACTS,
    QUESTION_TEMPLATES,
    REASON_TEMPLATES,
    DEFAULT_REASON,
    YES_NO_FACTS,
    COMBINABLE_FACT_GROUPS,
    COMBINED_QUESTION_TEMPLATES,
    COMBINED_REASON_TEMPLATES,
    LOCALIZED_DEFAULT_REASON,
    LOCALIZED_COMBINED_QUESTIONS,
    LOCALIZED_COMBINED_REASONS,
    LOCALIZED_QUESTIONS,
    LOCALIZED_REASONS,
)

YES_PATTERNS = {
    # English
    "yes", "yeah", "yep", "yup", "correct", "true", "i do", "we do", "female", "woman",
    # Tamil
    "ஆம்", "ஆமாம்", "சரி", "உண்மை", "உண்டு", "பெண்", "சரியானது", "ஆம் உண்டு",
    # Hindi
    "हाँ", "हां", "हाँजी", "जी हाँ", "जी हां", "सही", "सत्य", "महिला", "स्त्री",
    # Kannada
    "ಹೌದು", "ಸರಿ", "ನಿಜ", "ಮಹಿಳೆ",
    # Telugu
    "అవును", "సరే", "నిజం", "మహిళ",
    # Marathi
    "होय", "हो", "बरोबर", "सत्य", "स्त्री", "महिला",
}

NO_PATTERNS = {
    # English
    "no", "nope", "nah", "false", "don't", "dont", "i don't", "we don't", "do not", "does not", "male", "man",
    # Tamil
    "இல்லை", "இல்ல", "இல்லவே இல்லை", "தவறு", "கிடையாது", "ஆண்", "இல்லை இல்லை",
    # Hindi
    "नहीं", "ना", "नाहीं", "गलत", "अयोग्य", "पुरुष",
    # Kannada
    "ಇಲ್ಲ", "ತಪ್ಪು", "ಪುರುಷ",
    # Telugu
    "కాదు", "లేదు", "తప్పు", "పురుషుడు",
    # Marathi
    "नाही", "नाहीत", "चूक", "पुरुष",
}


def get_next_clarifying_question(
    category: str,
    missing_facts: List[str],
    language: str = "en"
) -> Optional[Dict[str, Any]]:
    """
    Determines the clarifying question to ask in the citizen's native language.
    Checks COMBINABLE_FACT_GROUPS first: if two-or-more still-missing blocking facts
    for the category form a known combinable pair, ask the combined question.
    Otherwise, prioritizes blocking facts first, followed by refining facts.
    """
    if not missing_facts or not category or category not in REQUIRED_FACTS:
        return None

    lang = language.lower() if language else "en"

    # Check COMBINABLE_FACT_GROUPS first
    combinable_pairs = COMBINABLE_FACT_GROUPS.get(category, [])
    for pair in combinable_pairs:
        f1, f2 = pair
        if f1 in missing_facts and f2 in missing_facts:
            # Check localized combined questions first
            q_template = (
                LOCALIZED_COMBINED_QUESTIONS.get(lang, {}).get(pair)
                or COMBINED_QUESTION_TEMPLATES.get(pair)
            )
            r_template = (
                LOCALIZED_COMBINED_REASONS.get(lang, {}).get(pair)
                or COMBINED_REASON_TEMPLATES.get(pair)
                or LOCALIZED_DEFAULT_REASON.get(lang, DEFAULT_REASON)
            )
            if q_template:
                return {
                    "fact_being_requested": f"{f1}+{f2}",
                    "facts_being_requested": [f1, f2],
                    "clarifying_question": q_template,
                    "reason_shown_to_user": r_template,
                }

    blocking = REQUIRED_FACTS[category]["blocking"]
    ordered = [f for f in blocking if f in missing_facts] + [
        f for f in missing_facts if f not in blocking
    ]
    if not ordered:
        return None

    next_fact = ordered[0]
    default_r = LOCALIZED_DEFAULT_REASON.get(lang, DEFAULT_REASON)

    question_text = (
        LOCALIZED_QUESTIONS.get(lang, {}).get(next_fact)
        or QUESTION_TEMPLATES.get(next_fact, f"Could you provide more details regarding: {next_fact}?")
    )
    reason_text = (
        LOCALIZED_REASONS.get(lang, {}).get(next_fact)
        or REASON_TEMPLATES.get(next_fact, default_r)
    )

    return {
        "fact_being_requested": next_fact,
        "facts_being_requested": [next_fact],
        "clarifying_question": question_text,
        "reason_shown_to_user": reason_text,
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
