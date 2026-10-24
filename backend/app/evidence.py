# backend/app/evidence.py

from typing import List, Dict, Any, Optional
from app.fact_requirements import REQUIRED_FACTS

# Categories with enacted state-level statutes in TN, MH, KA
# (State Shops & Establishments Acts for labour; State Rent / Tenancy Acts for tenancy)
STATE_EXPECTED_CATEGORIES = {
    "wrongful_termination",
    "unpaid_wages",
    "overtime_hours",
    "eviction_dispute",
    "security_deposit_dispute",
    "rent_increase_dispute",
    "repairs_maintenance_dispute",
    "tenant_landlord",
}


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

    # State law coverage check across all categories that have state legislation
    state_expected = bool(detected_category) and (detected_category in STATE_EXPECTED_CATEGORIES) and state in ("TN", "MH", "KA")
    if state_expected:
        if has_state_chunk:
            points += 2
            reasons.append(f"State-specific provision for {state} retrieved — answer is jurisdiction-specific.")
        else:
            reasons.append(f"No {state}-specific provision found; answer relies on central/model law only.")

    # Missing facts here are purely optional/refining because blocking facts already passed above
    if not missing_facts:
        points += 1
        reasons.append("No additional facts needed to answer this question.")
    else:
        reasons.append(f"Optional details that would sharpen this answer: {', '.join(sorted(missing_facts))}.")

    if points >= 5:
        level = "High"
    elif points >= 2:
        level = "Medium"
    else:
        level = "Low"

    # Never award 'High' on central/model law alone when binding state law exists for this topic & jurisdiction
    if state_expected and not has_state_chunk and level == "High":
        level = "Medium"

    return {
        "level": level,
        "reasons": reasons
    }

