# In-memory lightweight fallback when database connection is unavailable
FALLBACK_CORPUS = [
    {
        "id": "pwa-s3",
        "act": "Payment of Wages Act, 1936",
        "section": "Section 3",
        "jurisdiction": "central",
        "category": "unpaid_wages",
        "keywords": ["wages", "payment", "responsible", "employer", "unpaid", "pay", "salary", "due"],
        "text": "Every employer shall be responsible for the payment of all wages required to be paid under this Act to persons employed by him."
    },
    {
        "id": "pwa-s5",
        "act": "Payment of Wages Act, 1936",
        "section": "Section 5",
        "jurisdiction": "central",
        "category": "unpaid_wages",
        "keywords": ["wages", "time", "payment", "deadline", "delay", "monthly", "seven days", "ten days", "unpaid", "salary"],
        "text": "Wages of every person employed shall be paid before the expiry of the seventh day after the last day of the wage period where less than 1,000 persons are employed, or before the tenth day in any other case."
    },
    {
        "id": "ida-s25f",
        "act": "Industrial Disputes Act, 1947",
        "section": "Section 25F",
        "jurisdiction": "central",
        "category": "wrongful_termination",
        "keywords": ["retrenchment", "termination", "fired", "notice", "one month", "compensation", "workman", "wrongful"],
        "text": "No workman employed in any industry who has been in continuous service for not less than one year under an employer shall be retrenched unless given one month notice in writing and retrenchment compensation."
    },
    {
        "id": "posh-s4",
        "act": "Sexual Harassment of Women at Workplace Act, 2013",
        "section": "Section 4",
        "jurisdiction": "central",
        "category": "posh_complaint",
        "keywords": ["posh", "internal committee", "ic", "harassment", "complaint"],
        "text": "Every employer of a workplace employing 10 or more employees shall, by an order in writing, constitute an Internal Committee."
    }
]
