# backend/app/fact_requirements.py

REQUIRED_FACTS = {
    "unpaid_wages": {
        "blocking": ["unpaid_period", "monthly_wage_bracket"],
        "refining": ["employment_type", "has_written_contract"],
    },
    "wrongful_termination": {
        "blocking": ["tenure_length", "employment_type"],
        "refining": ["reason_given", "notice_period"],
    },
    "posh_complaint": {
        "blocking": ["incident_date", "complainant_gender"],
        "refining": ["icc_exists", "relationship_to_accused"],
    },
    "tenant_landlord": {
        "blocking": ["state_specific_tenancy_type", "notice_received"],
        "refining": ["lease_duration", "rent_amount"],
    },
    "pf_nonpayment": {
        "blocking": ["establishment_employee_count", "pf_deducted_on_payslip"],
        "refining": ["uan_allocated", "period_of_pf_default"],
    },
    "bonus_nonpayment": {
        "blocking": ["working_days_in_year", "establishment_employee_count"],
        "refining": ["salary_under_bonus_cap", "bonus_demand_sent"],
    },
    "gratuity_nonpayment": {
        "blocking": ["tenure_length", "resignation_or_retirement"],
        "refining": ["establishment_employee_count", "form_i_submitted"],
    },
    "maternity_benefit": {
        "blocking": ["worked_80_days", "establishment_employee_count"],
        "refining": ["notice_form_e_given", "unlawful_dismissal_during_leave"],
    },
    "overtime_hours": {
        "blocking": ["daily_weekly_hours_worked", "overtime_pay_received"],
        "refining": ["establishment_type", "attendance_logs_available"],
    },
    "eviction_dispute": {
        "blocking": ["written_eviction_notice", "rent_arrears_status"],
        "refining": ["lease_registered", "ground_for_eviction_stated"],
    },
    "security_deposit_dispute": {
        "blocking": ["deposit_amount_paid", "vacated_premises_date"],
        "refining": ["lease_deposit_refund_clause", "deduction_reasons_given"],
    },
    "rent_increase_dispute": {
        "blocking": ["three_months_notice_given", "lease_escalation_clause"],
        "refining": ["proposed_increase_percentage", "fair_rent_application_filed"],
    },
    "repairs_maintenance_dispute": {
        "blocking": ["written_repair_notice_sent", "nature_of_repair"],
        "refining": ["tenant_cost_estimate", "landlord_response_received"],
    },
}

QUESTION_TEMPLATES = {
    "unpaid_period": "How many months of salary are unpaid, and when was it last paid on time?",
    "monthly_wage_bracket": "Roughly what is your monthly salary — this affects which wage protections apply under the Payment of Wages Act / Code on Wages.",
    "employment_type": "Are you a permanent employee, on contract, or daily-wage/casual?",
    "has_written_contract": "Do you have a written appointment letter or employment contract?",
    "tenure_length": "How long have you worked there continuously without long breaks?",
    "reason_given": "Did your employer give a reason for the termination?",
    "notice_period": "Were you given any notice or notice pay before termination?",
    "incident_date": "When did the incident happen? This matters because there's a filing deadline.",
    "complainant_gender": "To determine which statutory protections apply under POSH, could you clarify your gender?",
    "icc_exists": "Does your workplace have an Internal Complaints Committee (ICC)?",
    "relationship_to_accused": "What is the accused person's position relative to you at work?",
    "state_specific_tenancy_type": "Is this a registered rental agreement or an informal arrangement?",
    "notice_received": "Have you received any written notice from your landlord?",
    "lease_duration": "How long was your lease term?",
    "rent_amount": "What is your monthly rent amount?",
    "establishment_employee_count": "How many employees roughly work at your establishment (e.g., under 10, 10-19, or 20+)?",
    "pf_deducted_on_payslip": "Does your monthly payslip show Provident Fund (PF) being deducted?",
    "uan_allocated": "Do you have a UAN (Universal Account Number) allocated by EPFO?",
    "period_of_pf_default": "For how many months has the PF not been deposited into your EPFO account?",
    "working_days_in_year": "Did you work at least 30 working days in the accounting year?",
    "salary_under_bonus_cap": "Is your monthly basic salary + DA under the statutory bonus ceiling (Rs. 21,000)?",
    "bonus_demand_sent": "Have you issued a written demand for the unpaid statutory bonus to your employer?",
    "resignation_or_retirement": "Did you resign, retire, or were you terminated after your service?",
    "form_i_submitted": "Have you submitted Form I (application for gratuity) to your employer?",
    "worked_80_days": "Did you work for at least 80 days in the 12 months preceding your expected delivery date?",
    "notice_form_e_given": "Did you give written notice (Form E) to your employer claiming maternity leave?",
    "unlawful_dismissal_during_leave": "Were you dismissed or given termination notice while on maternity leave?",
    "daily_weekly_hours_worked": "How many hours daily or weekly do you work beyond 9 hours daily / 48 hours weekly?",
    "overtime_pay_received": "Have you received single rate or double rate pay for your extra working hours?",
    "establishment_type": "Is your workplace a commercial shop/office or a manufacturing factory?",
    "attendance_logs_available": "Do you have proof of your working hours (e.g. biometric logs, emails, timesheets)?",
    "written_eviction_notice": "Has your landlord issued a formal written notice to vacate the premises?",
    "rent_arrears_status": "Are all monthly rent payments up to date, or are there rent arrears?",
    "lease_registered": "Is your tenancy agreement registered under state rent control laws?",
    "ground_for_eviction_stated": "What reason or ground for eviction did the landlord state in the notice?",
    "deposit_amount_paid": "What was the total security deposit amount paid to the landlord?",
    "vacated_premises_date": "When did you vacate the premises and hand over possession?",
    "lease_deposit_refund_clause": "What does your lease agreement specify regarding security deposit refund deadlines?",
    "deduction_reasons_given": "Has the landlord provided an itemized statement of deductions for damages?",
    "three_months_notice_given": "Did the landlord give 3 months prior written notice before increasing rent?",
    "lease_escalation_clause": "What rent increase percentage or terms are stated in your lease agreement?",
    "proposed_increase_percentage": "By what percentage or amount did the landlord demand to raise your rent?",
    "fair_rent_application_filed": "Have you filed an application before the Rent Authority for standard rent determination?",
    "written_repair_notice_sent": "Have you sent a formal 15-day written notice to the landlord requesting repairs?",
    "nature_of_repair": "What specific repairs are needed (e.g., structural seepage, plumbing, electrical)?",
    "tenant_cost_estimate": "Do you have an itemized cost estimate or bill for the required repairs?",
    "landlord_response_received": "Has the landlord responded to your written repair notice?",
}

REASON_TEMPLATES = {
    "unpaid_period": "so I can check if you're still within the 12-month filing window.",
    "incident_date": "so I can check if you're still within the POSH filing window.",
    "tenure_length": "since length of service changes which protections apply.",
    "employment_type": "since this determines which law applies to your case.",
    "monthly_wage_bracket": "because different statutory remedies apply depending on salary bracket under Payment of Wages Act / Code on Wages.",
    "establishment_employee_count": "because statutory coverage (such as POSH, PF, Gratuity, Bonus) depends on headcount thresholds.",
    "worked_80_days": "since 80 days of service in the preceding 12 months is a statutory precondition for Maternity Benefit.",
    "three_months_notice_given": "because state rent control legislation requires 3 months prior written notice for rent escalation.",
    "written_repair_notice_sent": "since 15 days written notice is required before a tenant can execute repairs and deduct cost.",
    "written_eviction_notice": "because summary eviction without statutory written notice is unlawful under Rent Control Acts.",
    "deposit_amount_paid": "to calculate your statutory refund claim and interest entitlement.",
}
DEFAULT_REASON = "to give you a more accurate answer."

YES_NO_FACTS = {
    "has_written_contract",
    "icc_exists",
    "notice_received",
    "complainant_gender",
    "pf_deducted_on_payslip",
    "uan_allocated",
    "working_days_in_year",
    "salary_under_bonus_cap",
    "bonus_demand_sent",
    "form_i_submitted",
    "worked_80_days",
    "notice_form_e_given",
    "unlawful_dismissal_during_leave",
    "attendance_logs_available",
    "written_eviction_notice",
    "rent_arrears_status",
    "lease_registered",
    "three_months_notice_given",
    "fair_rent_application_filed",
    "written_repair_notice_sent",
    "landlord_response_received",
}


def check_category_consistency(corpus_categories: set, pathway_categories: set, classify_prompt_categories: set):
    """
    Consistency check helper function to ensure all category sets match 100%.
    """
    all_sets = {"corpus": corpus_categories, "pathways": pathway_categories, "classify_prompt": classify_prompt_categories}
    reference = corpus_categories
    for name, s in all_sets.items():
        if s != reference:
            raise ValueError(f"Category mismatch: {name} has {s - reference} extra / {reference - s} missing vs corpus")
