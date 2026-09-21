"""
Auto-generated notice/complaint letter generator for KnowYourRights.
HARD PRIVACY CONSTRAINT:
This module executes strictly via local application template substitution.
User personal identifying fields (names, addresses, amounts) are NEVER
sent to any LLM or external provider.
"""

from datetime import date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.letter_templates import CLAIM_SENTENCE_TEMPLATES, TENANCY_CATEGORIES


class LetterFields(BaseModel):
    employee_name: str = Field(..., description="Full name of employee or tenant")
    employee_address: str = Field(..., description="Residential or postal address")
    counterparty_name: str = Field(..., description="Name of employer, company, or landlord")
    counterparty_address: str = Field(..., description="Address of employer or landlord")
    joining_date: Optional[str] = Field(default=None, description="Joining date or lease commencement date")
    designation: Optional[str] = Field(default=None, description="Job title or role")
    amount_claimed: Optional[str] = Field(default=None, description="Unpaid salary, deposit amount, or claim value")


def is_letter_eligible(
    status: str,
    has_direct_recourse: bool,
    category: Optional[str],
    citations: List[Any],
    evidence_level: Optional[str] = None
) -> bool:
    """
    A case is eligible for an auto-generated formal notice letter ONLY if:
    1. Status is fully resolved (no clarification pending, no error).
    2. hasDirectRecourse is True (the provisions directly cover the scenario).
    3. Evidence level is NOT Low.
    4. Category has a verified statutory claim template.
    5. At least one verified statutory citation exists to cite.
    """
    if status != "resolved":
        return False
    if has_direct_recourse is not True:
        return False
    if evidence_level and evidence_level.strip().lower() == "low":
        return False
    if not category or category not in CLAIM_SENTENCE_TEMPLATES:
        return False
    if not citations or len(citations) == 0:
        return False
    return True


def render_letter(
    category: str,
    act: str,
    section: str,
    authority: str,
    ask_text: str,
    fields: LetterFields,
    today_str: Optional[str] = None
) -> Dict[str, str]:
    """
    Renders both a plain text notice letter and a printable HTML document.
    Unprovided optional fields are left as clearly marked bracketed blanks
    so the user can clearly see what to fill in manually if downloaded partially filled.
    """
    current_date = today_str or date.today().strftime("%B %d, %Y")

    emp_name = fields.employee_name.strip() if fields.employee_name and fields.employee_name.strip() else "[Your Full Name]"
    emp_addr = fields.employee_address.strip() if fields.employee_address and fields.employee_address.strip() else "[Your Postal Address]"
    cp_name = fields.counterparty_name.strip() if fields.counterparty_name and fields.counterparty_name.strip() else "[Employer / Landlord / Company Name]"
    cp_addr = fields.counterparty_address.strip() if fields.counterparty_address and fields.counterparty_address.strip() else "[Recipient Registered Address]"

    designation_clause = f", as {fields.designation.strip()}" if fields.designation and fields.designation.strip() else ", as [Designation / Role]"
    joining_clause = f", since {fields.joining_date.strip()}" if fields.joining_date and fields.joining_date.strip() else ", since [Joining / Commencement Date]"

    period_or_amount = fields.amount_claimed.strip() if fields.amount_claimed and fields.amount_claimed.strip() else "[Amount / Period Claimed]"

    # Resolve claim template
    template = CLAIM_SENTENCE_TEMPLATES.get(
        category,
        "My statutory rights under Section {section} of the {act} have been violated."
    )
    claim_sentence = template.format(
        act=act or "Applicable Indian Statute",
        section=section or "Statutory Section",
        period_or_amount=period_or_amount,
        unpaid_period=period_or_amount,
        amount_claimed=period_or_amount
    )

    clean_ask = ask_text.strip()
    if clean_ask.endswith("."):
        clean_ask = clean_ask[:-1]
    if clean_ask:
        clean_ask = clean_ask[0].lower() + clean_ask[1:]
    else:
        clean_ask = "the outstanding statutory dues and grievances"

    subject_category = category.replace("_", " ").title()
    is_tenancy = category in TENANCY_CATEGORIES

    if is_tenancy:
        relationship_sentence = (
            f"I, {emp_name}, am / was a tenant residing at the premises leased under your administration"
            f"{joining_clause}."
        )
    else:
        relationship_sentence = (
            f"I, {emp_name}, was employed with your organization"
            f"{designation_clause}"
            f"{joining_clause}."
        )

    # 1. Plain text format
    text_content = f"""Date: {current_date}

To,
{cp_name}
{cp_addr}

Subject: Formal Notice regarding {subject_category} under Section {section}, {act}

Dear Sir / Madam,

{relationship_sentence}

{claim_sentence}

I hereby request that {clean_ask} be resolved within 15 days of receipt of this notice, failing which I will approach {authority} for statutory enforcement, compensation, and formal legal redressal.

Please treat this as formal written notice.

Regards,

{emp_name}
{emp_addr}
"""

    # 2. Formatted Printable HTML Document
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Formal Statutory Notice — {subject_category}</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 25mm 20mm;
    }}
    body {{
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #111;
      margin: 0;
      padding: 24px;
      background: #fff;
    }}
    .header-date {{
      text-align: right;
      font-weight: bold;
      margin-bottom: 24px;
    }}
    .recipient-block {{
      margin-bottom: 24px;
      white-space: pre-line;
    }}
    .subject-line {{
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 20px;
    }}
    .salutation {{
      margin-bottom: 16px;
    }}
    .letter-body {{
      text-align: justify;
      margin-bottom: 16px;
    }}
    .closing {{
      margin-top: 36px;
    }}
    .sender-block {{
      margin-top: 24px;
      white-space: pre-line;
    }}
    .statute-badge {{
      border-top: 1px solid #999;
      margin-top: 40px;
      padding-top: 8px;
      font-family: Arial, sans-serif;
      font-size: 8pt;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
  </style>
</head>
<body>
  <div class="header-date">{current_date}</div>

  <div class="recipient-block">
    <strong>To,</strong><br />
    {cp_name}<br />
    {cp_addr}
  </div>

  <div class="subject-line">
    Subject: Formal Statutory Notice regarding {subject_category} under Section {section} of {act}
  </div>

  <div class="salutation">Dear Sir / Madam,</div>

  <p class="letter-body">
    {relationship_sentence}
  </p>

  <p class="letter-body">
    <strong>{claim_sentence}</strong>
  </p>

  <p class="letter-body">
    I hereby formally request that {clean_ask} be completely settled and resolved within fifteen (15) days from the receipt of this notice, failing which I shall be constrained to initiate formal proceedings before the <strong>{authority}</strong> for enforcement of statutory rights, damages, interest, and costs without further reference to you.
  </p>

  <p class="letter-body">
    Please treat this communication as formal written statutory notice under the law.
  </p>

  <div class="closing">
    Yours sincerely,
    <div class="sender-block">
      <strong>{emp_name}</strong><br />
      {emp_addr}
    </div>
  </div>

  <div class="statute-badge">
    KnowYourRights Statutory Notice Draft · Reference: {act} §{section} · Legal Recourse Forum: {authority}
  </div>
</body>
</html>"""

    return {
        "text": text_content.strip(),
        "html": html_content.strip()
    }
