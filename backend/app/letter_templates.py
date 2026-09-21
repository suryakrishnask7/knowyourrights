"""
Statutory notice and complaint letter claim sentence templates for KnowYourRights.
Pure template substitution — no LLM calls are ever made with personal details.
"""

CLAIM_SENTENCE_TEMPLATES = {
    "unpaid_wages": (
        "I have not received my statutory wages for the period {period_or_amount}, "
        "in direct violation of Section {section} of the {act}."
    ),
    "wrongful_termination": (
        "I was terminated from my employment without the mandatory notice period, "
        "due inquiry, or statutory retrenchment compensation required under Section {section} of the {act}."
    ),
    "posh_complaint": (
        "This letter serves as formal written notice and submission regarding incidents of workplace harassment, "
        "as protected and mandated under Section {section} of the {act}."
    ),
    "tenant_landlord": (
        "My statutory tenancy rights and contractual protections under Section {section} of the {act} "
        "have been violated."
    ),
    "security_deposit_dispute": (
        "My security deposit of {period_or_amount} has not been refunded within the statutory window "
        "following lawful handover and vacation of the premises, in violation of Section {section} of the {act}."
    ),
    "eviction_dispute": (
        "The attempt to initiate summary eviction or terminate tenancy without the requisite statutory notice "
        "violates tenant protections guaranteed under Section {section} of the {act}."
    ),
    "rent_increase_dispute": (
        "The unilateral escalation of rent without adhering to agreed terms and statutory notice periods "
        "violates Section {section} of the {act}."
    ),
    "pf_nonpayment": (
        "Provident Fund contributions deducted from my salary have not been deposited into my EPFO account, "
        "constituting default under Section {section} of the {act}."
    ),
    "bonus_nonpayment": (
        "My statutory annual bonus entitlement for the financial year has not been disbursed within the mandatory window, "
        "in violation of Section {section} of the {act}."
    ),
    "gratuity_nonpayment": (
        "My statutory gratuity entitlement following separation from service has not been paid, "
        "in violation of Section {section} of the {act}."
    ),
    "maternity_benefit": (
        "My statutory maternity benefit entitlements, paid leave, and job security protections "
        "have not been honored, in direct violation of Section {section} of the {act}."
    ),
    "overtime_hours": (
        "I have been required to perform overtime work exceeding statutory limits without payment at the mandatory "
        "double overtime wage rate under Section {section} of the {act}."
    ),
}

TENANCY_CATEGORIES = {
    "tenant_landlord",
    "security_deposit_dispute",
    "eviction_dispute",
    "rent_increase_dispute",
}
