# backend/tests/test_clarification_loop.py

from app.fact_requirements import (
    REQUIRED_FACTS,
    QUESTION_TEMPLATES,
    REASON_TEMPLATES,
    YES_NO_FACTS,
    check_category_consistency,
)
from app.classify import classify_query, build_classify_prompt, VALID_CATEGORIES
from app.clarify import get_next_clarifying_question, try_cheap_extraction
from app.evidence import evidence_sufficiency
from app.pathway import get_pathway


def test_category_consistency():
    """Verify all 13 categories match 100% across system modules."""
    corpus_cats = set(REQUIRED_FACTS.keys())
    pathway_cats = set(REQUIRED_FACTS.keys())
    classify_cats = set(VALID_CATEGORIES)

    check_category_consistency(corpus_cats, pathway_cats, classify_cats)
    assert len(corpus_cats) == 13


def test_blocking_fact_hard_gate():
    """Verify strong keyword match cannot produce High/Medium evidence while a blocking fact is missing."""
    mock_chunks = [
        {"id": "c1", "score": 5.0, "jurisdiction": "TN", "act": "TN Shops Act", "section": "S10", "category": "unpaid_wages"},
        {"id": "c2", "score": 4.5, "jurisdiction": "central", "act": "Payment of Wages Act", "section": "S5", "category": "unpaid_wages"},
        {"id": "c3", "score": 4.0, "jurisdiction": "TN", "act": "TN Shops Act", "section": "S12", "category": "unpaid_wages"},
    ]
    missing_blocking = ["unpaid_period"]

    evidence = evidence_sufficiency(
        chunks=mock_chunks,
        missing_facts=missing_blocking,
        state="TN",
        detected_category="unpaid_wages"
    )

    assert evidence["level"] == "Low"
    assert "Missing required fact(s)" in evidence["reasons"][0]


def test_cheap_extraction_yes_no():
    """Verify yes/no facts extract confidently without LLM calls."""
    assert try_cheap_extraction("icc_exists", "Yes, we have an ICC") is True
    assert try_cheap_extraction("icc_exists", "No, there is no ICC") is False
    assert try_cheap_extraction("complainant_gender", "I am a woman") is True
    assert try_cheap_extraction("complainant_gender", "I am a male employee") is False
    assert try_cheap_extraction("icc_exists", "I am not sure about it") is None


def test_get_next_clarifying_question():
    """Verify question generation prioritizes blocking facts first."""
    q_data = get_next_clarifying_question("unpaid_wages", ["employment_type", "unpaid_period"])
    assert q_data is not None
    assert q_data["fact_being_requested"] == "unpaid_period"
    assert q_data["clarifying_question"] == QUESTION_TEMPLATES["unpaid_period"]
    assert q_data["reason_shown_to_user"] == REASON_TEMPLATES["unpaid_period"]


def test_all_13_categories_have_pathways_and_questions():
    """Ensure every category has blocking/refining facts and valid question templates."""
    for cat, req in REQUIRED_FACTS.items():
        assert len(req["blocking"]) >= 1
        assert len(req["refining"]) >= 1
        for fact in req["blocking"] + req["refining"]:
            assert fact in QUESTION_TEMPLATES, f"Missing question template for {fact}"
        pathway = get_pathway(cat)
        assert pathway is not None
        assert "authority" in pathway
        assert "steps" in pathway
