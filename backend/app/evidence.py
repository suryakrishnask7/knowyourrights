# backend/app/evidence.py

from typing import List, Dict, Any, Optional
from app.fact_requirements import REQUIRED_FACTS


def evidence_sufficiency(
    chunks: List[Dict[str, Any]],
    missing_facts: List[str],
    state: str,
    detected_category: Optional[str]
) -> Dict[str, Any]:
    """
    Determines evidence level.
    HARD GATE: If any blocking fact for the detected category is missing,
    returns 'Low' immediately before any point arithmetic.
    """
    if detected_category and detected_category in REQUIRED_FACTS:
        blocking = set(REQUIRED_FACTS[detected_category]["blocking"])
        still_missing_blocking = blocking & set(missing_facts)
        if still_missing_blocking:
            return {
                "level": "Low",
                "reasons": [
                    f"Missing required fact(s): {', '.join(sorted(still_missing_blocking))}."
                ]
            }

    reasons: List[str] = []
    top_score = chunks[0]["score"] if chunks and "score" in chunks[0] else 0
    has_state_chunk = any(c.get("jurisdiction") == state for c in chunks)
    has_missing_facts = len(missing_facts) > 0
    chunk_count = len(chunks)

    points = 0

    if chunk_count >= 3:
        points += 2
        reasons.append(f"{chunk_count} relevant provisions retrieved.")
    elif chunk_count >= 1:
        points += 1
        reasons.append(f"{chunk_count} relevant provision(s) retrieved.")
    else:
        reasons.append("No directly relevant provisions found for this query.")

    if top_score >= 4:
        points += 2
        reasons.append("Strong keyword match with retrieved provisions.")
    elif top_score >= 2:
        points += 1
        reasons.append("Moderate keyword match with retrieved provisions.")

    is_wrongful_term = (
        detected_category == "wrongful_termination" or
        any(c.get("category") == "wrongful_termination" for c in chunks)
    )
    if is_wrongful_term:
        if has_state_chunk:
            points += 2
            reasons.append(f"State-specific provision for {state} retrieved — answer is jurisdiction-specific.")
        else:
            points -= 1
            reasons.append(f"No {state}-specific provision found; answer relies on central law only.")

    if not has_missing_facts:
        points += 1
        reasons.append("No additional facts needed to answer this question.")
    else:
        points -= 1
        reasons.append(f"Missing information: {'; '.join(missing_facts)}.")

    if points >= 5:
        level = "High"
    elif points >= 2:
        level = "Medium"
    else:
        level = "Low"

    return {
        "level": level,
        "reasons": reasons
    }
