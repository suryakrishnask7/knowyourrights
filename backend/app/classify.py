import os
import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq

logger = logging.getLogger(__name__)

VALID_CATEGORIES = [
    "unpaid_wages",
    "wrongful_termination",
    "posh_complaint",
    "pf_nonpayment",
    "bonus_nonpayment",
    "gratuity_nonpayment",
    "maternity_benefit",
    "overtime_hours",
    "tenant_landlord",
    "eviction_dispute",
    "security_deposit_dispute",
    "rent_increase_dispute",
    "repairs_maintenance_dispute"
]

SYSTEM_PROMPT = """You are an expert legal classifier for Indian labour rights, workplace protections, and tenancy disputes.
Analyze the user's situation and classify it into EXACTLY ONE of the following 13 supported category IDs:

Worker Rights:
- "unpaid_wages": Delayed/unpaid salary, illegal deductions, below minimum wage.
- "wrongful_termination": Retrenchment without notice or severance, arbitrary dismissal, illegal firing.
- "posh_complaint": STRICTLY for allegations of workplace SEXUAL harassment (unwelcome physical contact, sexual advances, sexually coloured remarks, showing pornography, or sexual quid pro quo). MUST NEVER be used for general workplace stress, mental pressure, toxic manager, long hours, or non-sexual bullying (return null for general workplace disputes).
- "pf_nonpayment": Provident Fund deductions not deposited to EPFO, employer PF default, passbook discrepancy.
- "bonus_nonpayment": Non-payment or delay of statutory annual bonus (8.33% - 20%).
- "gratuity_nonpayment": Non-payment of gratuity after 5+ years of continuous service or on retirement/resignation.
- "maternity_benefit": Denial of 26 weeks paid maternity leave, unlawful termination during pregnancy, creche/medical bonus denial.
- "overtime_hours": Forced work beyond 9 hrs/day or 48 hrs/week, non-payment of double overtime wages.

Tenant Rights:
- "tenant_landlord": General tenancy terms, written lease deed validity, utility cutoff, privacy/quiet enjoyment.
- "eviction_dispute": Threat of forceful eviction, notice to quit, overstay compensation, Rent Court possession grounds.
- "security_deposit_dispute": Withholding advance security deposit, excessive deduction on move-out, deposit cap violations.
- "rent_increase_dispute": Unilateral/arbitrary rent hike, violation of 3-month statutory revision notice, standard rent determination.
- "repairs_maintenance_dispute": Landlord refusing structural/essential repairs, seepage, tenant deducting repair expense from rent.

CRITICAL INSTRUCTION: If a query describes general workplace issues (e.g. mental pressure, toxic boss, performance disputes, rude manager, unwritten internships) that do NOT involve explicit sexual harassment, wages, termination, PF, bonus, gratuity, maternity, or overtime, return "category": null.

Also extract an array of "missingFacts": Key factual gaps required to give a complete legal opinion (e.g. "Length of continuous service", "Written tenancy contract existence", "Establishment headcount").

Return ONLY valid JSON matching this schema:
{
  "category": "unpaid_wages" | "wrongful_termination" | "posh_complaint" | "pf_nonpayment" | "bonus_nonpayment" | "gratuity_nonpayment" | "maternity_benefit" | "overtime_hours" | "tenant_landlord" | "eviction_dispute" | "security_deposit_dispute" | "rent_increase_dispute" | "repairs_maintenance_dispute" | null,
  "missingFacts": ["fact 1", "fact 2"]
}
Do not include markdown code fences or conversational text."""

def classify_query(query_text: str) -> Dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("mock_"):
        # Heuristic fallback if GROQ_API_KEY is not configured
        q_lower = query_text.lower()
        cat: Optional[str] = None
        missing: List[str] = []
        
        if any(w in q_lower for w in ["pf", "provident fund", "epfo", "uan", "passbook"]):
            cat = "pf_nonpayment"
            missing = ["Establishment employee count (20+)", "Whether PF deduction appears on monthly payslip"]
        elif any(w in q_lower for w in ["gratuity", "5 years", "service completion", "retirement dues"]):
            cat = "gratuity_nonpayment"
            missing = ["Exact tenure of continuous service (completed years)", "Last drawn basic salary + DA"]
        elif any(w in q_lower for w in ["bonus", "diwali bonus", "annual bonus", "8.33%"]):
            cat = "bonus_nonpayment"
            missing = ["Whether worked at least 30 days in the accounting year", "Establishment employee count (20+)"]
        elif any(w in q_lower for w in ["maternity", "pregnant", "pregnancy", "creche", "delivery", "miscarriage"]):
            cat = "maternity_benefit"
            missing = ["Whether worked 80 days in preceding 12 months", "Establishment employee count (10+)"]
        elif any(w in q_lower for w in ["overtime", "extra hours", "double pay", "48 hours", "9 hours", "late night"]):
            cat = "overtime_hours"
            missing = ["Exact number of hours worked beyond 9 daily / 48 weekly", "Whether overtime logs were maintained"]
        elif any(w in q_lower for w in ["deposit", "advance", "refund deposit", "security advance"]):
            cat = "security_deposit_dispute"
            missing = ["Security deposit amount paid and receipt availability", "Date of vacating premises"]
        elif any(w in q_lower for w in ["evict", "eviction", "vacate", "throw out", "forceful possession"]):
            cat = "eviction_dispute"
            missing = ["Whether written eviction notice was served", "Status of monthly rent payments"]
        elif any(w in q_lower for w in ["increase rent", "rent hike", "revision", "escalation", "higher rent"]):
            cat = "rent_increase_dispute"
            missing = ["Whether 3 months prior notice was given", "Contract escalation clause terms"]
        elif any(w in q_lower for w in ["repair", "maintenance", "seepage", "leakage", "whitewash", "painting"]):
            cat = "repairs_maintenance_dispute"
            missing = ["Whether 15 days written notice was sent to landlord", "Photographic proof of repair defect"]
        elif any(w in q_lower for w in ["posh", "sexual harass", "sexual advance", "sexual assault", "internal complaints committee"]):
            cat = "posh_complaint"
            missing = ["Whether employer has 10+ employees", "Date of incident"]
        elif any(w in q_lower for w in ["fire", "fired", "terminat", "retrench", "dismiss", "resign", "notice"]):
            cat = "wrongful_termination"
            missing = ["Length of continuous service at the employer", "Whether written notice or severance was provided"]
        elif any(w in q_lower for w in ["rent", "landlord", "tenant", "lease", "agreement"]):
            cat = "tenant_landlord"
            missing = ["Whether a registered lease agreement exists"]
        elif any(w in q_lower for w in ["salary", "wage", "unpaid", "due", "pay", "deduction", "delayed"]):
            cat = "unpaid_wages"
            missing = ["Exact period of unpaid wages", "Whether a written employment contract exists"]
            
        return {"category": cat, "missingFacts": missing}

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=500,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Query: \"{query_text}\""}
            ],
            response_format={"type": "json_object"}
        )
        raw_content = response.choices[0].message.content or "{}"
        clean_json = raw_content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        cat = data.get("category")
        if cat not in VALID_CATEGORIES:
            cat = None
        return {
            "category": cat,
            "missingFacts": data.get("missingFacts", [])
        }
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return {"category": None, "missingFacts": []}
