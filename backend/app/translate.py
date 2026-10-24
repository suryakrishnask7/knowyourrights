import os
import json
import logging
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
import requests
from groq import Groq

load_dotenv()
logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "en": {"code": "en", "name": "English", "native": "English", "label": "EN"},
    "ta": {"code": "ta", "name": "Tamil", "native": "தமிழ்", "label": "தமிழ்"},
    "hi": {"code": "hi", "name": "Hindi", "native": "हिन्दी", "label": "हिन्दी"},
    "kn": {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "label": "ಕನ್ನಡ"},
    "mr": {"code": "mr", "name": "Marathi", "native": "मराठी", "label": "मराठी"},
    "te": {"code": "te", "name": "Telugu", "native": "తెలుగు", "label": "తెలుగు"},
}

def extract_json_safely(raw_text: str) -> dict:
    import re
    cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        try:
            return json.loads(cleaned[start_idx:end_idx + 1])
        except Exception:
            pass
    return json.loads(cleaned)

def _call_gemini_translation(prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    resp = requests.post(url, json=payload, timeout=25)
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if candidates and "content" in candidates[0]:
        parts = candidates[0]["content"].get("parts", [])
        if parts:
            return parts[0].get("text", "{}")
    raise ValueError("Empty response from Gemini")

def _call_groq_translation(prompt: str, api_key: str) -> str:
    client = Groq(api_key=api_key)
    res = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional legal translator specializing in Indian statutory law. "
                    "You translate legal information with utmost precision, keeping formal Act names "
                    "and Section numbers clear, authoritative, and bilingual. "
                    "Return ONLY valid JSON matching the exact input structure."
                )
            },
            {"role": "user", "content": prompt}
        ]
    )
    return res.choices[0].message.content or "{}"

def translate_legal_content(
    payload_to_translate: Dict[str, Any],
    target_lang: str
) -> Dict[str, Any]:
    """
    Translates legal case sheet content into one of the 6 supported languages:
    en (English), ta (Tamil), hi (Hindi), kn (Kannada), mr (Marathi), te (Telugu).
    """
    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES:
        return payload_to_translate

    lang_info = SUPPORTED_LANGUAGES[target_lang]
    lang_name = lang_info["name"]
    native_name = lang_info["native"]

    system_instructions = (
        f"You are a legal translator for Indian citizens. Translate the string values in the provided JSON "
        f"into {lang_name} ({native_name}).\n"
        f"CRITICAL TRANSLATION RULES:\n"
        f"1. Translate into natural, authoritative {lang_name} in native script.\n"
        f"2. Keep statutory Act names and Section numbers bilingual or clear (e.g., 'Payment of Wages Act, 1936 / சம்பளப் பணியிட சட்டம், 1936' or Section 5 / பிரிவு 5).\n"
        f"3. Do not modify keys or structure in any way.\n"
        f"4. For array fields (like 'pathway_steps' or 'evidence_reasons'), preserve each item and translate all text values, including any nested 'docs' string arrays (e.g. translate each required statutory record into natural {lang_name}).\n"
        f"5. Return strictly valid JSON only."
    )

    prompt = f"{system_instructions}\n\nINPUT JSON:\n{json.dumps(payload_to_translate, ensure_ascii=False)}"

    # Check for Gemini first if configured (Google AI Studio keys start with AIzaSy)
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key and not gemini_key.startswith("mock_") and not gemini_key.startswith("AQ."):
        try:
            logger.info("Translating to %s using Google Gemini...", lang_name)
            raw = _call_gemini_translation(prompt, gemini_key)
            return extract_json_safely(raw)
        except Exception as e:
            logger.warning("Gemini translation error, falling back to Groq: %s", e)

    # Fall back to Groq
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and not groq_key.startswith("mock_"):
        try:
            logger.info("Translating to %s using Groq...", lang_name)
            raw = _call_groq_translation(prompt, groq_key)
            return extract_json_safely(raw)
        except Exception as e:
            logger.error("Groq translation error: %s", e)
            return payload_to_translate

    # Mock / No-op fallback
    return payload_to_translate


def translate_notice_letter(letter_text: str, target_lang: str) -> str:
    """
    Translates a formal notice letter into the target Indian language.
    Preserves brackets, names, addresses, and statutory sections bilingually.
    """
    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES or not letter_text.strip():
        return letter_text

    lang_info = SUPPORTED_LANGUAGES[target_lang]
    lang_name = lang_info["name"]
    native_name = lang_info["native"]

    system_prompt = (
        f"You are a professional legal translator specializing in formal Indian statutory notices and legal demands. "
        f"Translate the provided formal legal notice letter into formal {lang_name} ({native_name}).\n"
        f"CRITICAL RULES:\n"
        f"1. Maintain formal legal letter formatting (Date, To, Subject, Dear Sir/Madam, body paragraphs, closing).\n"
        f"2. Keep statutory Act names and Section numbers bilingual or clearly identifiable (e.g. 'Section 11(2) / பிரிவு 11(2)').\n"
        f"3. Preserve all bracketed placeholders intact (e.g. [Employer / Company Name], [Lease Commencement Date], [Claim Amount in INR]).\n"
        f"4. Output ONLY the translated notice letter text without explanations, commentary, or markdown fences."
    )

    # Gemini first if valid
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key and not gemini_key.startswith("mock_") and not gemini_key.startswith("AQ."):
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_prompt}\n\nLETTER TO TRANSLATE:\n{letter_text}"}]}],
                "generationConfig": {"temperature": 0.2}
            }
            resp = requests.post(url, json=payload, timeout=25)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and parts[0].get("text"):
                    return parts[0].get("text").strip()
        except Exception as e:
            logger.warning("Gemini letter translation error: %s", e)

    # Groq fallback
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and not groq_key.startswith("mock_"):
        try:
            client = Groq(api_key=groq_key)
            res = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": letter_text}
                ]
            )
            out = res.choices[0].message.content or ""
            # Strip any markdown code block fences if added
            out = out.replace("```text", "").replace("```markdown", "").replace("```", "").strip()
            return out if out else letter_text
        except Exception as e:
            logger.error("Groq letter translation error: %s", e)

    return letter_text
