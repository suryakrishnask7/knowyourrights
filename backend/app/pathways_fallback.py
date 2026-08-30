# In-memory lightweight fallback when database connection is unavailable
FALLBACK_PATHWAYS = {
    "unpaid_wages": {
        "authority": "Authority under Payment of Wages Act / Labour Commissioner",
        "deadlineNote": "Within 12 months of the date on which wages were due (Section 15, Payment of Wages Act, 1936).",
        "steps": [
            {
                "title": "Gather documentary evidence of unpaid dues",
                "detail": "Assemble your appointment letter, salary slips, bank account statements, and written payment demands.",
                "docs": ["Appointment letter", "Salary slips", "Bank statement", "Attendance records"]
            },
            {
                "title": "Issue a formal written legal demand notice",
                "detail": "Send a formal registered demand letter giving the employer 7-15 days to settle unpaid wages.",
                "docs": ["Signed demand letter", "Postal delivery receipt"]
            },
            {
                "title": "File a claim petition before Payment of Wages Authority",
                "detail": "Submit Form A application under Section 15 of the Payment of Wages Act to the District Labour Commissioner.",
                "docs": ["Form A claim petition (in duplicate)", "Copy of demand notice"]
            }
        ]
    },
    "wrongful_termination": {
        "authority": "Conciliation Officer / Labour Court / Industrial Tribunal / State Shops Appellate Authority",
        "deadlineNote": "Under Industrial Disputes Act: Conciliation within 3 years; Under State Shops Acts: Appeal within 30-60 days.",
        "steps": [
            {
                "title": "Preserve termination communication and service records",
                "detail": "Keep copies of termination letter, experience certificate, and proof of 240 days continuous service.",
                "docs": ["Termination letter", "Service certificate", "Salary slips showing tenure"]
            },
            {
                "title": "File an appeal under State Shops Act or raise Industrial Dispute",
                "detail": "File an appeal under State Shops & Establishments Act or raise an industrial dispute petition under Section 2A before the Conciliation Officer.",
                "docs": ["Appellate petition", "Proof of continuous service"]
            }
        ]
    },
    "posh_complaint": {
        "authority": "Internal Committee (IC) at workplace / Local Committee (LC) at District level",
        "deadlineNote": "Within 3 months from date of incident (extendable by up to another 3 months by IC/LC).",
        "steps": [
            {
                "title": "Document incidents chronologically and preserve digital evidence",
                "detail": "Maintain written records with dates, times, digital screenshots (chats/emails), and witness names.",
                "docs": ["Chronological incident statement", "Screenshots of chats/emails"]
            },
            {
                "title": "Submit formal written complaint to the Presiding Officer",
                "detail": "Submit 6 copies of the signed complaint with evidence to the IC (or District Local Committee if under 10 workers).",
                "docs": ["Formal complaint letter (6 copies)", "Supporting digital evidence"]
            },
            {
                "title": "Request statutory interim relief",
                "detail": "Apply under Section 12 for interim transfer, up to 3 months paid leave, or restraining respondent."
            }
        ]
    },
    "pf_nonpayment": {
        "authority": "Regional Provident Fund Commissioner (RPFC) / EPFO / EPFiGMS Grievance Portal",
        "deadlineNote": "Grievances can be filed during employment or within 3 years. Section 7A inquiries have no limitation bar.",
        "steps": [
            {
                "title": "Verify passbook disparity and register EPFiGMS grievance",
                "detail": "Download EPFO passbook, compare deducted salary slip amounts, and register grievance on epfigms.gov.in.",
                "docs": ["EPFO passbook", "Salary slips showing PF deduction", "UAN statement"]
            },
            {
                "title": "File representation for Section 7A inquiry and penal recovery",
                "detail": "Submit written petition to RPFC demanding Section 7A quasi-judicial inquiry and Section 14B damages."
            }
        ]
    },
    "bonus_nonpayment": {
        "authority": "Labour Commissioner / Controlling Authority under Payment of Bonus Act",
        "deadlineNote": "Employer must pay statutory bonus within 8 months of financial year close (Section 19).",
        "steps": [
            {
                "title": "Verify eligibility (min 30 working days) and issue demand notice",
                "detail": "Confirm 30 days work in financial year and send demand letter citing Section 10 mandatory 8.33% bonus.",
                "docs": ["Salary slips", "Attendance record"]
            },
            {
                "title": "File recovery application under Section 21",
                "detail": "Submit Section 21 application to Labour Commissioner for Collector recovery certificate.",
                "docs": ["Section 21 application", "Calculation of bonus dues"]
            }
        ]
    },
    "gratuity_nonpayment": {
        "authority": "Controlling Authority under Payment of Gratuity Act (Assistant Labour Commissioner)",
        "deadlineNote": "Apply to employer in Form I within 30 days; file Form N with Controlling Authority within 90 days of default.",
        "steps": [
            {
                "title": "Calculate entitlement and submit Form I to employer",
                "detail": "Calculate 15 days pay per completed year after 5 years service and serve Form I via registered post.",
                "docs": ["Service certificate", "Last drawn salary slip", "Form I application"]
            },
            {
                "title": "File Form N claim petition before Controlling Authority",
                "detail": "If employer defaults within 30 days, submit Form N before Assistant Labour Commissioner for recovery.",
                "docs": ["Form N application (in triplicate)", "Postal proof of Form I delivery"]
            }
        ]
    },
    "maternity_benefit": {
        "authority": "Inspector under Maternity Benefit Act / District Labour Officer",
        "deadlineNote": "Notice of claim in Form E prior to leave; complaint for non-payment within 1 year under Section 17.",
        "steps": [
            {
                "title": "Verify 80-day qualifying service and serve Form E notice",
                "detail": "Serve written notice in Form E claiming 26 weeks paid leave (12 weeks for 2+ surviving children).",
                "docs": ["Form E notice", "Medical pregnancy certificate (Form B)"]
            },
            {
                "title": "File complaint against unlawful discharge or non-payment",
                "detail": "Under Section 12, dismissal during maternity is void. File complaint under Section 17 with Labour Inspector.",
                "docs": ["Complaint petition under Section 17", "Medical records"]
            }
        ]
    },
    "overtime_hours": {
        "authority": "Inspector of Factories / Labour Inspector under State Shops & Establishments Act",
        "deadlineNote": "Claims for unpaid double overtime wages can be filed within 12 months under Section 15 Payment of Wages Act.",
        "steps": [
            {
                "title": "Compile daily attendance logs and biometric records",
                "detail": "Assemble proof of work exceeding 9 hours daily or 48 hours weekly.",
                "docs": ["Biometric export logs", "Email/task timestamps", "Monthly payslips"]
            },
            {
                "title": "File claim for double overtime wages",
                "detail": "File claim petition before Payment of Wages Authority demanding statutory twice ordinary rate of pay.",
                "docs": ["Overtime calculation sheet", "Attendance proof"]
            }
        ]
    },
    "tenant_landlord": {
        "authority": "Rent Authority / Rent Court / DLSA Mediator",
        "deadlineNote": "Notice periods: 15 days for residential month-to-month leases under Transfer of Property Act.",
        "steps": [
            {
                "title": "Review written tenancy agreement terms",
                "detail": "Verify notice periods, security deposit terms, and rent escalation clauses in registered agreement.",
                "docs": ["Registered tenancy agreement", "Past rent receipts"]
            },
            {
                "title": "Approach Rent Authority / DLSA for dispute adjudication",
                "detail": "Submit petition before Rent Authority for determination of rights or restoration of essential services.",
                "docs": ["Tenancy petition", "Proof of rent payments"]
            }
        ]
    },
    "eviction_dispute": {
        "authority": "Rent Court / Rent Controller (State-specific)",
        "deadlineNote": "Tenant must respond to eviction summons within statutory response window (typically 30-90 days).",
        "steps": [
            {
                "title": "Examine eviction notice and deposit arrears to prevent forfeiture",
                "detail": "Deposit undisputed arrears within statutory window (1 month under MTA / 90 days in MH) to seek relief.",
                "docs": ["Eviction notice", "Tenancy agreement", "Rent payment receipts"]
            },
            {
                "title": "File written statement / objections before Rent Court",
                "detail": "Submit objections before Rent Court challenging groundless eviction or utility cutoff.",
                "docs": ["Written statement of defense", "Supporting receipts"]
            }
        ]
    },
    "security_deposit_dispute": {
        "authority": "Rent Authority / Consumer Disputes Redressal Commission / Civil Court",
        "deadlineNote": "Refund due on vacating; limitation is 2 years before Consumer Commission or 3 years in Civil Court.",
        "steps": [
            {
                "title": "Document vacant possession handover and property condition",
                "detail": "Preserve timestamped photos/videos and signed key handover receipt.",
                "docs": ["Handover acknowledgement", "Photos of vacant premises", "Original deposit receipt"]
            },
            {
                "title": "Serve 15-day legal demand notice and file claim before Rent Authority / Consumer Forum",
                "detail": "Send registered legal demand notice; file complaint on e-Daakhil for refund with statutory interest.",
                "docs": ["Legal demand notice", "Consumer claim petition"]
            }
        ]
    },
    "rent_increase_dispute": {
        "authority": "Rent Authority / Rent Court / Rent Controller",
        "deadlineNote": "Landlord must provide 3 months prior written notice before revised rent takes effect.",
        "steps": [
            {
                "title": "Verify contract escalation clause and issue written objection",
                "detail": "Check agreed escalation terms and object in writing if hike violates 3-month statutory notice requirement.",
                "docs": ["Tenancy agreement", "Rent hike notice from landlord"]
            },
            {
                "title": "Apply to Rent Authority for standard rent determination",
                "detail": "Submit application under Section 10 to fix fair standard rent and prevent unlawful escalation."
            }
        ]
    },
    "repairs_maintenance_dispute": {
        "authority": "Rent Authority / Rent Court / Rent Controller",
        "deadlineNote": "Tenant can execute necessary repairs and deduct cost from rent after 15 days written notice.",
        "steps": [
            {
                "title": "Document defect and serve formal 15-day written repair notice",
                "detail": "Photograph structural damage and send formal notice citing statutory landlord repair obligations.",
                "docs": ["Photos/videos of defect", "Written 15-day repair notice"]
            },
            {
                "title": "Execute repairs and deduct expense from monthly rent",
                "detail": "If landlord defaults after 15 days, carry out repairs and deduct cost with itemized bills from rent.",
                "docs": ["Itemized contractor GST bills", "Notice of rent deduction"]
            }
        ]
    }
}
