import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestApiEndpoints(unittest.TestCase):

    def test_query_and_letter_render_flow(self):
        # 1. Test POST /api/query with user_name on a resolved query
        payload = {
            "query": "My employer has not paid my salary for two months. I have an employment contract and salary slips.",
            "state": "TN",
            "user_name": "Priya",
            "facts": {"unpaid_period": "2 months", "employment_contract": True},
            "clarification_round": 2,
            "asked_facts": ["unpaid_period", "employment_contract"]
        }
        res = client.post("/api/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Check fields
        self.assertFalse(data["needsClarification"])
        self.assertIn("answer", data)
        self.assertIn("answerSimple", data)
        self.assertTrue(data["answer"].startswith("Hi Priya,"))
        self.assertTrue(data["answerSimple"].startswith("Hi Priya,"))
        self.assertIn("letterEligible", data)
        self.assertEqual(data["user_name"], "Priya")

        # 2. Test POST /api/letter/render
        letter_req = {
            "category": "unpaid_wages",
            "act": "Code on Wages, 2019",
            "section": "Section 17",
            "authority": "Authority under the Code on Wages",
            "ask_text": "Settle unpaid salary arrears",
            "fields": {
                "employee_name": "Priya Sundaram",
                "employee_address": "Chennai, Tamil Nadu",
                "counterparty_name": "Tech Corp Pvt Ltd",
                "counterparty_address": "OMR, Chennai",
                "joining_date": "2023-01-15",
                "designation": "Data Analyst",
                "amount_claimed": "₹1,50,000"
            }
        }
        l_res = client.post("/api/letter/render", json=letter_req)
        self.assertEqual(l_res.status_code, 200)
        l_data = l_res.json()
        self.assertIn("text", l_data)
        self.assertIn("html", l_data)
        self.assertIn("Priya Sundaram", l_data["text"])
        self.assertIn("Tech Corp Pvt Ltd", l_data["text"])
        self.assertIn("₹1,50,000", l_data["text"])
        self.assertIn("<!DOCTYPE html>", l_data["html"])


if __name__ == "__main__":
    unittest.main()
