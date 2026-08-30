# backend/tests/test_clarification_e2e.py

import os
import asyncio
from app.main import app, QueryRequest, handle_query
from app.cases import get_case


def test_full_clarification_flow():
    """
    E2E simulation of query -> clarification question -> answer -> resolution / cap-out.
    """
    loop = asyncio.get_event_loop()

    # Step 1: Initial query missing blocking facts (e.g. unpaid salary)
    req1 = QueryRequest(query="My employer has not paid my salary.", state="TN")
    res1 = loop.run_until_complete(handle_query(req1))

    assert res1.case_id is not None
    case_id = res1.case_id

    # If API key is mock, classify_query returns missing facts ["unpaid_period", "monthly_wage_bracket"]
    assert res1.needsClarification is True
    assert res1.turnCount == 1
    assert res1.maxTurns == 2
    assert res1.clarifyingQuestion is not None
    assert res1.clarifyingReason is not None

    case_state_1 = get_case(case_id)
    assert case_state_1["status"] == "awaiting_clarification"
    assert case_state_1["clarification_round"] == 1

    # Step 2: User answers clarification question (Turn 1 response)
    req2 = QueryRequest(query="2 months salary unpaid since June", state="TN", case_id=case_id)
    res2 = loop.run_until_complete(handle_query(req2))

    assert res2.case_id == case_id
    # Second turn check: if still missing another blocking fact or refining fact, turnCount becomes 2 or resolves
    if res2.needsClarification:
        assert res2.turnCount == 2
        assert res2.maxTurns == 2

        # Step 3: User answers turn 2 (Cap-out test)
        req3 = QueryRequest(query="Permanent employee with contract", state="TN", case_id=case_id)
        res3 = loop.run_until_complete(handle_query(req3))

        assert res3.case_id == case_id
        # On turn 2 completion (cap-out), needsClarification MUST be False
        assert res3.needsClarification is False
        case_state_3 = get_case(case_id)
        assert case_state_3["status"] == "resolved"
    else:
        # Resolved after 1 round
        assert res2.needsClarification is False
        case_state_2 = get_case(case_id)
        assert case_state_2["status"] == "resolved"


if __name__ == "__main__":
    test_full_clarification_flow()
    print("E2E CLARIFICATION FLOW TEST PASSED SUCCESSFULLY!")
