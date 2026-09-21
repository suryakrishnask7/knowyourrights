import unittest
from app.letter import LetterFields, is_letter_eligible, render_letter
from app.cache import make_cache_key
from app.generate import call_llm
from app.main import personalize_text, personalize_simple_text


class TestSimplifyAndLetter(unittest.TestCase):

    def test_answer_simple_mock_generation(self):
        chunks = [{
            "act": "Code on Wages, 2019",
            "section": "Section 13",
            "jurisdiction": "central",
            "text": "Overtime wages shall not be less than twice the ordinary rate.",
            "category": "unpaid_wages"
        }]
        result = call_llm("I worked overtime without pay", "TN", chunks)
        self.assertIn("answer", result)
        self.assertIn("answerSimple", result)
        self.assertTrue(len(result["answerSimple"]) > 10)

    def test_is_letter_eligible_gates(self):
        citations = [{"act": "Payment of Wages Act, 1936", "section": "Section 15", "jurisdiction": "central"}]

        # 1. Eligible case
        self.assertTrue(is_letter_eligible(
            status="resolved",
            has_direct_recourse=True,
            category="unpaid_wages",
            citations=citations,
            evidence_level="High"
        ))

        # 2. Ineligible: Low evidence
        self.assertFalse(is_letter_eligible(
            status="resolved",
            has_direct_recourse=True,
            category="unpaid_wages",
            citations=citations,
            evidence_level="Low"
        ))

        # 3. Ineligible: No direct recourse
        self.assertFalse(is_letter_eligible(
            status="resolved",
            has_direct_recourse=False,
            category="unpaid_wages",
            citations=citations,
            evidence_level="High"
        ))

        # 4. Ineligible: Status not resolved
        self.assertFalse(is_letter_eligible(
            status="awaiting_clarification",
            has_direct_recourse=True,
            category="unpaid_wages",
            citations=citations,
            evidence_level="High"
        ))

        # 5. Ineligible: Empty citations
        self.assertFalse(is_letter_eligible(
            status="resolved",
            has_direct_recourse=True,
            category="unpaid_wages",
            citations=[],
            evidence_level="High"
        ))

        # 6. Ineligible: Unknown or unsupported category
        self.assertFalse(is_letter_eligible(
            status="resolved",
            has_direct_recourse=True,
            category="random_unsupported_category",
            citations=citations,
            evidence_level="High"
        ))

    def test_render_letter_substitution_and_blanks(self):
        fields = LetterFields(
            employee_name="Ananya Sharma",
            employee_address="42 Green Park, Chennai",
            counterparty_name="Tech Corp India Ltd",
            counterparty_address="Tech Park, OMR, Chennai",
            joining_date=None,  # skipped optional field
            designation="Software Engineer",
            amount_claimed="INR 1,20,000"
        )
        rendered = render_letter(
            category="unpaid_wages",
            act="Code on Wages, 2019",
            section="Section 17",
            authority="Authority under the Code on Wages",
            ask_text="Settle all outstanding wage arrears",
            fields=fields,
            today_str="October 10, 2026"
        )

        text = rendered["text"]
        html = rendered["html"]

        # User fields present
        self.assertIn("Ananya Sharma", text)
        self.assertIn("Tech Corp India Ltd", text)
        self.assertIn("Software Engineer", text)
        self.assertIn("INR 1,20,000", text)
        self.assertIn("Code on Wages, 2019", text)
        self.assertIn("Section 17", text)
        self.assertIn("Authority under the Code on Wages", text)

        # Skipped joining date is marked blank
        self.assertIn("[Joining / Commencement Date]", text)

        # HTML has full structure
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("Ananya Sharma", html)

    def test_cache_key_invariance_with_user_name(self):
        # Two users with different names asking same category/state/missing_facts
        key1 = make_cache_key("unpaid_wages", "TN", ["joining_date"])
        key2 = make_cache_key("unpaid_wages", "TN", ["joining_date"])
        self.assertEqual(key1, key2)

        # Personalization wraps dynamically without modifying underlying answer
        raw = "Under Section 15 of the Payment of Wages Act, wages must be paid on time."
        p1 = personalize_text(raw, "Karthik")
        p2 = personalize_text(raw, "Deepa")
        self.assertTrue(p1.startswith("Hi Karthik,"))
        self.assertTrue(p2.startswith("Hi Deepa,"))
        self.assertIn(raw, p1)
        self.assertIn(raw, p2)

        # Blank/None name leaves text untouched
        self.assertEqual(personalize_text(raw, None), raw)
        self.assertEqual(personalize_text(raw, "   "), raw)


if __name__ == "__main__":
    unittest.main()
