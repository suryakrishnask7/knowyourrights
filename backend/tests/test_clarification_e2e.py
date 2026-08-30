# backend/tests/test_clarification_e2e.py

import asyncio
from app.main import app, QueryRequest, handle_query


def test_full_clarification_flow():
    """
    E2E simulation of query -> clarification question -> answer -> resolution / cap-out.
    Stateless flow: state is passed in request payload without any database cases table.
    """
    loop = asyncio.get_event_loop()

    # Step 1: Initial query missing blocking facts (e.g. unpaid salary)
    req1 = QueryRequest(query="My employer has not paid my salary.", state="TN")
    res1 = loop.run_until_complete(handle_query(req1))

    assert res1.needsClarification is True
    assert res1.turnCount == 1
    assert res1.maxTurns == 2
    assert res1.clarifyingQuestion is not None
    assert res1.clarifyingReason is not None

    # Step 2: User answers clarification question (Turn 1 response)
    req2 = QueryRequest(
        query="2 months salary unpaid since June",
        state="TN",
        facts=res1.facts,
        clarification_round=res1.clarification_round,
        asked_facts=res1.asked_facts,
        original_query=res1.original_query,
    )
    res2 = loop.run_until_complete(handle_query(req2))

    if res2.needsClarification:
        assert res2.turnCount == 2
        assert res2.maxTurns == 2

        # Step 3: User answers turn 2 (Cap-out test)
        req3 = QueryRequest(
            query="Permanent employee with contract",
            state="TN",
            facts=res2.facts,
            clarification_round=res2.clarification_round,
            asked_facts=res2.asked_facts,
            original_query=res2.original_query,
        )
        res3 = loop.run_until_complete(handle_query(req3))

        # On turn 2 completion (cap-out), needsClarification MUST be False
        assert res3.needsClarification is False
    else:
        # Resolved after 1 round
        assert res2.needsClarification is False


if __name__ == "__main__":
    test_full_clarification_flow()
    print("E2E CLARIFICATION FLOW TEST PASSED SUCCESSFULLY!")
