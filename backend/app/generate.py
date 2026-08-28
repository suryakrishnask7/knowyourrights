import re
import os
import json
import logging
from typing import List, Dict, Any
from groq import Groq

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a legal information assistant specialising in Indian law, covering labour rights, tenancy rights, and workplace protections. You provide accurate, grounded information to people about their legal rights.

CRITICAL RULES:
1. Answer ONLY using the legal provisions provided in the context below. Do not add facts, case law, or provisions not present in the context.
2. Cite the exact Act name and Section number for every factual claim you make.
3. Be specific, practical, and plain-language. People need to understand what to do.
4. If the context does not have enough information to fully answer the question, say so clearly and list what is missing in missingFacts.
5. "hasDirectRecourse": Set to true if the provided legal provisions directly address and provide a statutory remedy or procedure for the user's situation. Set to false if the provisions do not cover the user's situation, are irrelevant/mismatched, or if there is no direct statutory recourse under the provided law.
6. Return your response as valid JSON matching this exact schema:

{
  "answer": "Your full plain-language answer here (2-4 paragraphs)",
  "citations": [
    { "act": "Act Name", "section": "Section X", "jurisdiction": "central | TN | MH | KA" }
  ],
  "hasDirectRecourse": true | false,
  "missingFacts": ["fact 1 that would help", "fact 2"],
  "detectedCategory": "unpaid_wages | wrongful_termination | posh_complaint | pf_nonpayment | bonus_nonpayment | gratuity_nonpayment | maternity_benefit | overtime_hours | tenant_landlord | eviction_dispute | security_deposit_dispute | rent_increase_dispute | repairs_maintenance_dispute | null"
}

Do not include markdown, code fences, or any text outside the JSON object."""




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
    text = re.sub(r"\s*(?:the\s+rule,\s+applied|the\s+rule\s+applied)\s*:", NL + NL + "The rule, applied:", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*what\s+to\s+do\s*:", NL + NL + "What to do:", text, flags=re.IGNORECASE)
    text = re.sub(r"\n{3,}", NL + NL, text)
    return text.strip()


def call_llm(
    query: str,
    state: str,
    chunks: List[Dict[str, Any]]
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
    
    user_message = f"""The worker is in {state_names.get(state, state)}.

Their situation:
"{query}"

Relevant legal provisions:
{chunk_context}

Answer based only on the provisions above."""

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not configured.")

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
        if isinstance(parsed, dict) and "answer" in parsed:
            parsed["answer"] = post_process_answer(parsed["answer"])
        return parsed
    except Exception as e:
        logger.error(f"Error calling LLM via Groq: {e}")
        return {
            "answer": f"An error occurred while generating the legal response: {str(e)}",
            "citations": [],
            "missingFacts": ["System error generating LLM output"],
            "detectedCategory": None
        }
