import re
import os
import json
import logging
from typing import List, Dict, Any
from groq import Groq

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are KnowYourRights (KYR), a grounded statutory legal information assistant specialising in Indian law (Labour Rights, Tenancy Protections, Workplace Rights, and Statutory Remedies).

CRITICAL RESPONSE RULES:
1. Speak directly as KnowYourRights (KYR). NEVER use third-party meta-phrases such as "according to the legal material provided", "the context provided", "the customer using this", or "as an AI model". Speak authoritatively and directly to the user about their statutory rights.
2. Ground your citations strictly in verified Indian Acts and Section numbers provided in the context below.
3. Be specific, practical, and plain-language.
4. LOW CONFIDENCE & OUT OF SCOPE HANDLING:
   - If the user's query falls outside direct statutory coverage, has low evidence confidence, or lacks specific provisions in the context:
     a) Explicitly state that the query falls [OUT OF SCOPE / LOW DIRECT STATUTORY CONFIDENCE].
     b) Plainly explain what facts or statutory remedies are missing.
     c) Suggest relevant Indian Acts, statutory authorities, or legal forums to look into (such as Payment of Wages Act, Industrial Disputes Act, Rent Controller Court, Labour Commissioner, Consumer Forum, or District Legal Services Authority).
5. "hasDirectRecourse": Set to true if the provided legal provisions directly address and provide an actionable statutory remedy for the user's situation. Set to false if the query is out of scope, lacks direct statutory grounding, or has no direct recourse under the provided law.
6. "answerSimple" consistency constraint: "answerSimple" must reach the same bottom-line conclusion as "answer" — never a different or hedged conclusion, only simpler phrasing. If "answer" says a deduction is likely unauthorized, "answerSimple" must say that too, just in plainer words.
7. If a name is given, you may address the user by it naturally once near the start of the answer (e.g. 'Hi {name}, here is what applies to your situation') — do not use it repeatedly or artificially throughout the answer.
8. Return your response strictly as valid JSON matching this schema:

{
  "answer": "Your direct, authoritative legal summary (2-4 clear paragraphs)",
  "answerSimple": "The same conclusion in 3-5 short sentences, plain everyday words, no section numbers inline (citations still live only in the shared citations array), written for someone with no legal background and no assumed familiarity with terms like 'retrenchment' or 'statutory'.",
  "citations": [
    { "act": "Act Name", "section": "Section X", "jurisdiction": "central | TN | MH | KA" }
  ],
  "hasDirectRecourse": true | false,
  "missingFacts": ["fact 1 missing", "fact 2 missing"],
  "detectedCategory": "unpaid_wages | wrongful_termination | posh_complaint | pf_nonpayment | bonus_nonpayment | gratuity_nonpayment | maternity_benefit | overtime_hours | tenant_landlord | eviction_dispute | security_deposit_dispute | rent_increase_dispute | repairs_maintenance_dispute | null"
}

Do not include markdown code blocks, think tags, or text outside the JSON object."""


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


def post_process_answer(answer: str) -> str:
    text = answer.strip()
    import re
    NL = chr(10)
    # Scrub third-party meta phrases
    text = re.sub(r"according\s+to\s+the\s+legal\s+(?:material|provisions|context)\s+(?:what\s+)?you\s+provided,?\s*", "Based on Indian statutory law, ", text, flags=re.IGNORECASE)
    text = re.sub(r"the\s+customer\s+who\s+is\s+using\s+this,?\s*", "For your situation, ", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*(?:the\s+rule,\s+applied|the\s+rule\s+applied)\s*:", NL + NL + "The rule, applied:", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*what\s+to\s+do\s*:", NL + NL + "What to do:", text, flags=re.IGNORECASE)
    text = re.sub(r"\n{3,}", NL + NL, text)
    return text.strip()


def call_llm(
    query: str,
    state: str,
    chunks: List[Dict[str, Any]],
    user_name: str | None = None
) -> Dict[str, Any]:
    state_names = {
        "TN": "Tamil Nadu",
        "MH": "Maharashtra",
        "KA": "Karnataka"
    }

    chunk_strings = []
    for i, c in enumerate(chunks):
        j_str = "Central Law" if c.get("jurisdiction") == "central" else state_names.get(c.get("jurisdiction", ""), c.get("jurisdiction", ""))
        chunk_strings.append(f"[{i + 1}] {c.get('act', c.get('act_name'))} — {c.get('section')} ({j_str})\n{c.get('text')}")

    chunk_context = "\n\n".join(chunk_strings)

    user_message = f"""The worker is in {state_names.get(state, state)}{f", and their name is {user_name}" if user_name else ""}.

Their situation:
"{query}"

Relevant legal provisions:
{chunk_context}

Answer based only on the provisions above."""

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("mock_"):
        c_list = []
        for c in chunks:
            c_list.append({
                "act": c.get("act", c.get("act_name", "Statute")),
                "section": c.get("section", "Section 1"),
                "jurisdiction": c.get("jurisdiction", "central")
            })
        cat = chunks[0].get("category") if chunks else None
        return {
            "answer": f"Based on statutory provisions under Indian law in {state_names.get(state, state)}, employers and landlords are bound by mandatory notice and payment regulations. [Reported facts: {query}]",
            "answerSimple": f"Under Indian law in {state_names.get(state, state)}, you have clear rights regarding payments and notice periods that must be respected.",
            "citations": c_list,
            "hasDirectRecourse": True,
            "missingFacts": [],
            "detectedCategory": cat
        }

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            max_tokens=1500,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
        )

        raw_text = response.choices[0].message.content or "{}"
        parsed = extract_json_from_llm(raw_text)
        if isinstance(parsed, dict):
            if "answer" in parsed and parsed["answer"]:
                parsed["answer"] = post_process_answer(parsed["answer"])
            if "answerSimple" in parsed and parsed["answerSimple"]:
                parsed["answerSimple"] = post_process_answer(parsed["answerSimple"])
            elif "answer" in parsed and parsed["answer"]:
                # Safe fallback if LLM omitted answerSimple
                parsed["answerSimple"] = parsed["answer"]
        return parsed
    except Exception as e:
        logger.error(f"Error calling LLM via Groq: {e}")
        return {
            "answer": f"An error occurred while generating the legal response: {str(e)}",
            "answerSimple": "An error occurred while generating the legal response.",
            "citations": [],
            "missingFacts": ["System error generating LLM output"],
            "detectedCategory": None
        }
