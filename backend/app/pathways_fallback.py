# In-memory lightweight fallback when database connection is unavailable
FALLBACK_PATHWAYS = {
    "unpaid_wages": {
        "authority": "Authority under Payment of Wages Act / Labour Commissioner",
        "deadlineNote": "Within 12 months of the date on which wages were due (Section 15, Payment of Wages Act).",
        "steps": [
            {
                "title": "Gather documentary evidence of unpaid dues",
                "detail": "Assemble your appointment letter, salary slips, bank account statements, and written payment demands.",
                "docs": ["Appointment letter", "Salary slips", "Bank statement"]
            },
            {
                "title": "File a claim petition before Payment of Wages Authority",
                "detail": "Submit Form A application under Section 15 of the Payment of Wages Act to the District Labour Commissioner.",
                "docs": ["Form A claim petition", "Copy of demand notice"]
            }
        ]
    },
    "wrongful_termination": {
        "authority": "Conciliation Officer / Labour Court / State Shops Appellate Authority",
        "deadlineNote": "Within 3 years under Industrial Disputes Act; within 30-60 days under State Shops Acts.",
        "steps": [
            {
                "title": "Preserve termination communication and service records",
                "detail": "Keep copies of termination letter, experience certificate, and proof of 240 days continuous service.",
                "docs": ["Termination letter", "Service certificate"]
            },
            {
                "title": "Raise an industrial dispute / State Shops appeal",
                "detail": "Submit an industrial dispute petition before the Assistant Labour Commissioner or State Shops Appellate Authority."
            }
        ]
    },
    "posh_complaint": {
        "authority": "Internal Committee (IC) at workplace / Local Committee (LC) at District level",
        "deadlineNote": "Within 3 months from the date of incident (extendable by up to 3 months by IC/LC).",
        "steps": [
            {
                "title": "Submit formal written complaint to the Presiding Officer",
                "detail": "Submit 6 copies of the signed complaint with evidence to the IC (or District LC if under 10 employees).",
                "docs": ["Written complaint letter", "Supporting chats/emails"]
            }
        ]
    },
    "tenant_landlord": {
        "authority": "Rent Authority / Rent Court / DLSA Mediator",
        "deadlineNote": "Notice periods specified under Transfer of Property Act / State Rent Acts.",
        "steps": [
            {
                "title": "Review written tenancy agreement",
                "detail": "Verify notice periods, deposit terms, and rent escalation clauses in your registered lease deed.",
                "docs": ["Tenancy agreement", "Rent receipts"]
            }
        ]
    }
}
