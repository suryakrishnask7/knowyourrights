# backend/tests/test_translation.py
# pyrefly: ignore[missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.translate import SUPPORTED_LANGUAGES, translate_legal_content

client = TestClient(app)

def test_supported_languages_list():
    res = client.get("/api/languages")
    assert res.status_code == 200
    data = res.json()
    assert "languages" in data
    assert "en" in data["languages"]
    assert "ta" in data["languages"]
    assert "hi" in data["languages"]
    assert "kn" in data["languages"]
    assert "mr" in data["languages"]
    assert "te" in data["languages"]

def test_translation_english_noop():
    req = {
        "target_language": "en",
        "answer": "You have the right to statutory wages.",
        "answerSimple": "You must be paid on time.",
        "evidence_reasons": ["Direct statutory match"],
        "pathway_authority": "Labour Commissioner"
    }
    res = client.post("/api/translate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["target_language"] == "en"
    assert data["answer"] == req["answer"]
    assert data["answerSimple"] == req["answerSimple"]

def test_translation_unsupported_language():
    req = {
        "target_language": "fr",
        "answer": "Test answer"
    }
    res = client.post("/api/translate", json=req)
    assert res.status_code == 400


def test_translation_with_pathway_steps_docs():
    req = {
        "target_language": "en",
        "answer": "Test answer",
        "pathway_steps": [
            {
                "title": "File claim",
                "detail": "Submit Form A to Labour Commissioner",
                "docs": ["Employment agreement", "Bank statement"]
            }
        ]
    }
    res = client.post("/api/translate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert len(data["pathway_steps"]) == 1
    assert data["pathway_steps"][0]["title"] == "File claim"

