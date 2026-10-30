import os
import json
import logging
import re
import threading
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Ensure .env is loaded regardless of working directory
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
load_dotenv()
try:
    from deep_translator import MyMemoryTranslator, GoogleTranslator
    HAS_DEEP_TRANSLATOR = True
except ImportError:
    HAS_DEEP_TRANSLATOR = False

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

HEADER_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "ta": {
        "date": "தேதி:",
        "to": "பெறுநர்,",
        "subject": "பொருள்:",
        "salutation": "மதிப்பிற்குரிய ஐயா / அம்மா,",
        "closing": "இப்படிக்கு,",
        "section_word": "பிரிவு",
    },
    "hi": {
        "date": "दिनांक:",
        "to": "सेवा में,",
        "subject": "विषय:",
        "salutation": "महोदय / महोदया,",
        "closing": "भवदीय,",
        "section_word": "धारा",
    },
    "kn": {
        "date": "ದಿನಾಂಕ:",
        "to": "ಇವರಿಗೆ,",
        "subject": "ವಿಷಯ:",
        "salutation": "ಗೌರವಾನ್ವಿತ ಮಹಾಶಯರೇ / ಮಹಾಶಯರೇ,",
        "closing": "ತಮ್ಮ ನಂಬಿಕಸ್ಥ,",
        "section_word": "ವಿಭಾಗ",
    },
    "mr": {
        "date": "दिनांक:",
        "to": "प्रति,",
        "subject": "विषय:",
        "salutation": "आदरणीय महोदय / महोदया,",
        "closing": "आपला / आपली नम्र,",
        "section_word": "कलम",
    },
    "te": {
        "date": "తేదీ:",
        "to": "స్వీకర్త / చిరునామా,",
        "subject": "విషయం:",
        "salutation": "గౌరవనీయులైన అయ్యా / అమ్మా,",
        "closing": "భవదీయుడు / భవదీయురాలు,",
        "section_word": "విభాగం",
    },
}

JURISDICTION_NATIVE: Dict[str, Dict[str, str]] = {
    "ta": {"central": "மத்திய அரசு", "tn": "தமிழ்நாடு", "mh": "மகாராஷ்டிரா", "ka": "கர்நாடகா"},
    "hi": {"central": "केन्द्रीय", "tn": "तमिलनाडु", "mh": "महाराष्ट्र", "ka": "कर्नाटक"},
    "kn": {"central": "ಕೇಂದ್ರ", "tn": "ತಮಿಳುನಾಡು", "mh": "ಮಹಾರಾಷ್ಟ್ರ", "ka": "ಕರ್ನಾಟಕ"},
    "mr": {"central": "केंद्रीय", "tn": "तमिळनाडू", "mh": "महाराष्ट्र", "ka": "कर्नाटक"},
    "te": {"central": "కేంద్ర", "tn": "తమిళనాడు", "mh": "మహారాష్ట్ర", "ka": "కర్ణాటక"},
}


PLACEHOLDER_TRANSLATIONS: Dict[str, List[Tuple[str, str]]] = {
    "ta": [
        ("[Employer / Company / Landlord Full Legal Name]", "[நிறுவனம் / முதலாளி / வீட்டு உரிமையாளரின் முழு சட்டப்பூர்வ பெயர்]"),
        ("[Employer / Company / Landlord Name]", "[நிறுவனம் / முதலாளி / வீட்டு உரிமையாளரின் பெயர்]"),
        ("[Registered Office Address / Landlord Postal Address, PIN]", "[நிறுவனத்தின் பதிவு அலுவலக முகவரி / உரிமையாளர் அஞ்சல் முகவரி, பின்கோடு]"),
        ("[Registered Office Address / Postal Address]", "[பதிவு அலுவலக முகவரி / அஞ்சல் முகவரி]"),
        ("[Joining / Commencement Date]", "[பணியில் சேர்ந்த தேதி / தொடக்க தேதி]"),
        ("[Lease Commencement Date]", "[வாடகை ஒப்பந்த தொடக்க தேதி]"),
        ("[Your Designation / Job Title / Department]", "[உங்கள் பதவி / பணியின் பெயர் / துறை]"),
        ("[Your Designation / Job Title]", "[உங்கள் பதவி / பணியின் பெயர்]"),
        ("[Your Complete Postal Address, City, State, PIN]", "[உங்கள் முழுமையான அஞ்சல் முகவரி, நகரம், மாநிலம், பின்கோடு]"),
        ("[Your Complete Postal Address, City, State]", "[உங்கள் முழுமையான அஞ்சல் முகவரி, நகரம், மாநிலம்]"),
        ("[Contact Number & Email ID]", "[தொடர்பு எண் மற்றும் மின்னஞ்சல் முகவரி]"),
        ("[Claim Amount in INR, e.g., Rs. ________ / Duration of Non-Payment]", "[கோரப்படும் தொகை (ரூ.), எ.கா., ரூ. ________ / நிலுவைக் காலம்]"),
        ("[Claim Amount in INR]", "[கோரப்படும் தொகை (ரூபாய்)]"),
        ("[Full Legal Name]", "[முழு சட்டப்பூர்வ பெயர்]"),
        ("[Your Full Legal Name]", "[உங்கள் முழு சட்டப்பூர்வ பெயர்]"),
    ],
    "hi": [
        ("[Employer / Company / Landlord Full Legal Name]", "[नियोक्ता / कंपनी / मकान मालिक का पूरा कानूनी नाम]"),
        ("[Employer / Company / Landlord Name]", "[नियोक्ता / कंपनी / मकान मालिक का नाम]"),
        ("[Registered Office Address / Landlord Postal Address, PIN]", "[पंजीकृत कार्यालय का पता / मकान मालिक का डाक पता, पिन]"),
        ("[Registered Office Address / Postal Address]", "[पंजीकृत कार्यालय का पता / डाक पता]"),
        ("[Joining / Commencement Date]", "[कार्यभार ग्रहण / प्रारंभ करने की तिथि]"),
        ("[Lease Commencement Date]", "[पट्टा / किराया प्रारंभ होने की तिथि]"),
        ("[Your Designation / Job Title / Department]", "[आपका पद / कार्य पदनाम / विभाग]"),
        ("[Your Designation / Job Title]", "[आपका पद / कार्य पदनाम]"),
        ("[Your Complete Postal Address, City, State, PIN]", "[आपका पूरा डाक पता, शहर, राज्य, पिनकोड]"),
        ("[Your Complete Postal Address, City, State]", "[आपका पूरा डाक पता, शहर, राज्य]"),
        ("[Contact Number & Email ID]", "[संपर्क नंबर एवं ईमेल आईडी]"),
        ("[Claim Amount in INR, e.g., Rs. ________ / Duration of Non-Payment]", "[दावा की गई राशि (रुपये में), उदा. रु. ________ / भुगतान न होने की अवधि]"),
        ("[Claim Amount in INR]", "[दावा की गई राशि (रुपये में)]"),
        ("[Full Legal Name]", "[पूरा कानूनी नाम]"),
        ("[Your Full Legal Name]", "[आपका पूरा कानूनी नाम]"),
    ],
    "te": [
        ("[Employer / Company / Landlord Full Legal Name]", "[యజమాని / కంపెనీ / ఇంటి యజమాని పూర్తి చట్టపరమైన పేరు]"),
        ("[Employer / Company / Landlord Name]", "[యజమాని / కంపెనీ / ఇంటి యజమాని పేరు]"),
        ("[Registered Office Address / Landlord Postal Address, PIN]", "[రిజిస్టర్డ్ ఆఫీస్ చిరునామా / ఇంటి యజమాని పోస్టల్ చిరునామా, పిన్]"),
        ("[Registered Office Address / Postal Address]", "[రిజిస్టర్డ్ ఆఫీస్ చిరునామా / పోస్టల్ చిరునామా]"),
        ("[Joining / Commencement Date]", "[ఉద్యోగంలో చేరిన తేదీ / ప్రారంభ తేదీ]"),
        ("[Lease Commencement Date]", "[అద్దె ఒప్పంద ప్రారంభ తేదీ]"),
        ("[Your Designation / Job Title / Department]", "[మీ హోదా / ఉద్యోగ శీర్షిక / విభాగం]"),
        ("[Your Designation / Job Title]", "[మీ హోదా / ఉద్యోగ శీర్షిక]"),
        ("[Your Complete Postal Address, City, State, PIN]", "[మీ పూర్తి పోస్టల్ చిరునామా, నగరం, రాష్ట్రం, పిన్ కోడ్]"),
        ("[Your Complete Postal Address, City, State]", "[మీ పూర్తి పోస్టల్ చిరునామా, నగరం, రాష్ట్రం]"),
        ("[Contact Number & Email ID]", "[సంప్రదింపు నంబర్ & ఇమెయిల్ ఐడి]"),
        ("[Claim Amount in INR, e.g., Rs. ________ / Duration of Non-Payment]", "[క్లెయిమ్ మొత్తం (రూపాయల్లో), ఉదా., రూ. ________ / చెల్లించని కాలవ్యవధి]"),
        ("[Claim Amount in INR]", "[క్లెయిమ్ మొత్తం (రూపాయల్లో)]"),
        ("[Full Legal Name]", "[పూర్తి చట్టపరమైన పేరు]"),
        ("[Your Full Legal Name]", "[మీ పూర్తి చట్టపరమైన పేరు]"),
    ],
    "kn": [
        ("[Employer / Company / Landlord Full Legal Name]", "[ಉದ್ಯೋಗದಾತ / ಕಂಪನಿ / ಮನೆ ಮಾಲೀಕರ ಪೂರ್ಣ ಕಾನೂನುಬದ್ಧ ಹೆಸರು]"),
        ("[Employer / Company / Landlord Name]", "[ಉದ್ಯೋಗದಾತ / ಕಂಪನಿ / ಮನೆ ಮಾಲೀಕರ ಹೆಸರು]"),
        ("[Registered Office Address / Landlord Postal Address, PIN]", "[ನೋಂದಾಯಿತ ಕಚೇರಿ ವಿಳಾಸ / ಮನೆ ಮಾಲೀಕರ ಅಂಚೆ ವಿಳಾಸ, ಪಿನ್]"),
        ("[Registered Office Address / Postal Address]", "[ನೋಂದಾಯಿತ ಕಚೇರಿ ವಿಳಾಸ / ಅಂಚೆ ವಿಳಾಸ]"),
        ("[Joining / Commencement Date]", "[ಸೇವೆಗೆ ಸೇರಿದ ದಿನಾಂಕ / ಪ್ರಾರಂಭ ದಿನಾಂಕ]"),
        ("[Lease Commencement Date]", "[ಬಾಡಿಗೆ ಪ್ರಾರಂಭ ದಿನಾಂಕ]"),
        ("[Your Designation / Job Title / Department]", "[ನಿಮ್ಮ ಹುದ್ದೆ / ಕೆಲಸದ ಶೀರ್ಷಿಕೆ / ಇಲಾಖೆ]"),
        ("[Your Designation / Job Title]", "[ನಿಮ್ಮ ಹುದ್ದೆ / ಕೆಲಸದ ಶೀರ್ಷಿಕೆ]"),
        ("[Your Complete Postal Address, City, State, PIN]", "[ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಅಂಚೆ ವಿಳಾಸ, ನಗರ, ರಾಜ್ಯ, ಪಿನ್ ಕೋಡ್]"),
        ("[Your Complete Postal Address, City, State]", "[ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಅಂಚೆ ವಿಳಾಸ, ನಗರ, ರಾಜ್ಯ]"),
        ("[Contact Number & Email ID]", "[ಸಂಪರ್ಕ ಸಂಖ್ಯೆ ಮತ್ತು ಇಮೇಲ್ ಐಡಿ]"),
        ("[Claim Amount in INR, e.g., Rs. ________ / Duration of Non-Payment]", "[ಕ್ಲೈಮ್ ಮೊತ್ತ (ರೂಪಾಯಿಗಳಲ್ಲಿ), ಉದಾ., ರೂ. ________ / ಪಾವತಿಸದ ಅವಧಿ]"),
        ("[Claim Amount in INR]", "[ಕ್ಲೈಮ್ ಮೊತ್ತ (ರೂಪಾಯಿಗಳಲ್ಲಿ)]"),
        ("[Full Legal Name]", "[ಪೂರ್ಣ ಕಾನೂನುಬದ್ಧ ಹೆಸರು]"),
        ("[Your Full Legal Name]", "[ನಿಮ್ಮ ಪೂರ್ಣ ಕಾನೂನುಬದ್ಧ ಹೆಸರು]"),
    ],
    "mr": [
        ("[Employer / Company / Landlord Full Legal Name]", "[नियोक्ता / कंपनी / घरमालकाचे पूर्ण कायदेशीर नाव]"),
        ("[Employer / Company / Landlord Name]", "[नियोक्ता / कंपनी / घरमालकाचे नाव]"),
        ("[Registered Office Address / Landlord Postal Address, PIN]", "[नोंदणीकृत कार्यालयाचा पत्ता / घरमालकाचा टपाल पत्ता, पिन]"),
        ("[Registered Office Address / Postal Address]", "[नोंदणीकृत कार्यालयाचा पत्ता / टपाल पत्ता]"),
        ("[Joining / Commencement Date]", "[रुजू झाल्याची तारीख / प्रारंभ तारीख]"),
        ("[Lease Commencement Date]", "[भाडेकरार प्रारंभ तारीख]"),
        ("[Your Designation / Job Title / Department]", "[तुमचे पद / कामाचे नाव / विभाग]"),
        ("[Your Designation / Job Title]", "[तुमचे पद / कामाचे नाव]"),
        ("[Your Complete Postal Address, City, State, PIN]", "[तुमचा संपूर्ण टपाल पत्ता, शहर, राज्य, पिनकोड]"),
        ("[Your Complete Postal Address, City, State]", "[तुमचा संपूर्ण टपाल पत्ता, शहर, राज्य]"),
        ("[Contact Number & Email ID]", "[संपर्क क्रमांक आणि ईमेल आयडी]"),
        ("[Claim Amount in INR, e.g., Rs. ________ / Duration of Non-Payment]", "[दावा केलेली रक्कम (रुपयांमध्ये), उदा., रु. ________ / थकबाकीचा कालावधी]"),
        ("[Claim Amount in INR]", "[दावा केलेली रक्कम (रुपयांमध्ये)]"),
        ("[Full Legal Name]", "[पूर्ण कायदेशीर नाव]"),
        ("[Your Full Legal Name]", "[तुमचे पूर्ण कायदेशीर नाव]"),
    ],
}
EVIDENCE_LEVEL_NATIVE: Dict[str, Dict[str, str]] = {
    "ta": {"High": "அதிகம்", "Medium": "மிதமான", "Low": "குறைவு"},
    "hi": {"High": "उच्च", "Medium": "मध्यम", "Low": "निम्न"},
    "kn": {"High": "ಉನ್ನತ", "Medium": "ಮಧ್ಯಮ", "Low": "ಕಡಿಮೆ"},
    "mr": {"High": "उच्च", "Medium": "मध्यम", "Low": "कमी"},
    "te": {"High": "అధిక", "Medium": "మధ్యస్థ", "Low": "తక్కువ"},
}

# ── Tier 0: Thread-Safe In-Memory LRU Translation Cache ─────────────────────────
_CACHE_LOCK = threading.Lock()
_TRANSLATION_CACHE: Dict[str, str] = {}
_MAX_CACHE_SIZE = 1000

def _get_cache(key: str) -> Optional[str]:
    with _CACHE_LOCK:
        return _TRANSLATION_CACHE.get(key)

def _set_cache(key: str, val: str) -> None:
    with _CACHE_LOCK:
        if len(_TRANSLATION_CACHE) >= _MAX_CACHE_SIZE:
            # Drop oldest 20%
            keys = list(_TRANSLATION_CACHE.keys())[:200]
            for k in keys:
                _TRANSLATION_CACHE.pop(k, None)
        _TRANSLATION_CACHE[key] = val

def _is_pure_numeric_or_trivial(text: str) -> bool:
    """Return True if text is just numbers, currency symbols, or very short punctuation."""
    cleaned = re.sub(r'[\d\s,.\-₹$€£%:+/]+', '', text).strip()
    return len(cleaned) == 0


# ── Tier 1: Groq LLM Invocation with Model Fallbacks ─────────────────────────────

GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
]

def _call_groq_text(
    messages: List[Dict[str, str]],
    temperature: float = 0.1,
    max_tokens: int = 2500,
) -> Optional[str]:
    """
    Calls Groq with automatic model cascade (120b -> qwen27b -> 20b).
    Returns string content on success or None if all models fail.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("mock_"):
        return None

    client = Groq(api_key=api_key)

    for model_name in GROQ_MODELS:
        try:
            res = client.chat.completions.create(
                model=model_name,
                messages=messages,  # type: ignore[arg-type]
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = res.choices[0].message.content or ""
            content = content.replace("```markdown", "").replace("```text", "").replace("```", "").strip()
            if content:
                return content
        except Exception as e:
            logger.warning("Groq model %s attempt failed (%s), trying next...", model_name, e)

    return None


# ── Tier 2: Deep-Translator Fallback ─────────────────────────────────────────────

def _call_deep_translator(text: str, target_lang: str, source_lang: str = "en") -> Optional[str]:
    """Fallback translator using MyMemory or Google via deep-translator."""
    if not HAS_DEEP_TRANSLATOR or not text.strip():
        return None

    src_code = "en" if source_lang in ("auto", "en", None) else source_lang

    # Try GoogleTranslator first
    try:
        translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
        if translated and translated.strip():
            return translated.strip()
    except Exception as e:
        logger.debug("deep-translator Google failed: %s", e)

    # Try MyMemoryTranslator
    try:
        src = f"{source_lang}-IN" if source_lang in ("ta", "hi", "kn", "mr", "te", "en") else source_lang
        tgt = f"{target_lang}-IN" if target_lang in ("ta", "hi", "kn", "mr", "te", "en") else target_lang
        translated = MyMemoryTranslator(source=src, target=tgt).translate(text)
        if translated and translated.strip():
            return translated.strip()
    except Exception as e:
        logger.debug("deep-translator MyMemory failed: %s", e)

    return None


# ── Post-processing Cleanup Filter ───────────────────────────────────────────────

def _apply_cleanup(result: Dict[str, Any], target_lang: str) -> Dict[str, Any]:
    """
    Post-processing safety net: ensures Act and Section labels are properly localized
    without leaking English structural keywords like 'Section Section' or 'Central'.
    """
    headers = HEADER_TRANSLATIONS.get(target_lang, {})
    sec_word = headers.get("section_word", "Section")
    jur_map = JURISDICTION_NATIVE.get(target_lang, {})
    ev_map = EVIDENCE_LEVEL_NATIVE.get(target_lang, {})

    def fix_str(s: str) -> str:
        if not isinstance(s, str):
            return s
        s = re.sub(r'\bSection\s+Section\b', sec_word, s, flags=re.IGNORECASE)
        s = re.sub(r'\bSection\b', sec_word, s)
        for eng, native in jur_map.items():
            if eng == "central":
                s = re.sub(r'\bCentral\b', native, s, flags=re.IGNORECASE)
            elif eng == "tn":
                s = re.sub(r'\bTamil Nadu\b', native, s, flags=re.IGNORECASE)
            elif eng == "mh":
                s = re.sub(r'\bMaharashtra\b', native, s, flags=re.IGNORECASE)
            elif eng == "ka":
                s = re.sub(r'\bKarnataka\b', native, s, flags=re.IGNORECASE)
        for eng, native in ev_map.items():
            s = re.sub(rf'\b{eng}\b', native, s)
        return s

    def fix_node(node: Any) -> Any:
        if isinstance(node, str):
            return fix_str(node)
        if isinstance(node, list):
            return [fix_node(item) for item in node]
        if isinstance(node, dict):
            return {k: fix_node(v) for k, v in node.items()}
        return node

    return fix_node(result)  # type: ignore[return-value]


# ── Legal Case Content Translation (Batched Single-Call Engine) ──────────────────

def translate_legal_content(
    payload_to_translate: Dict[str, Any],
    target_lang: str
) -> Dict[str, Any]:
    """
    Translates full legal case sheet content into one of the supported languages:
    en, ta, hi, kn, mr, te.

    Architected with Delimited Batching:
    Packages all fields into ONE single high-fidelity prompt.
    1 request translates the entire case sheet in < 1.5s, eliminating rate-limits.
    """
    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES:
        return payload_to_translate

    lang_info = SUPPORTED_LANGUAGES[target_lang]
    lang_name = lang_info["name"]
    lang_native = lang_info["native"]

    # 1. Check Cache
    cache_key = f"case_{target_lang}_{hash(str(payload_to_translate.get('answer', ''))[:100])}"
    cached_val = _get_cache(cache_key)
    if cached_val:
        try:
            return json.loads(cached_val)
        except Exception:
            pass

    # 2. Package all fields into a single delimited batch
    prompt_parts = [
        f"You are a professional legal translator specializing in Indian statutory law.",
        f"Translate the following legal case brief into authentic, formal {lang_name} ({lang_native}).",
        f"CRITICAL RULES:",
        f"1. Preserve all Act names and Section numbers (e.g. use '{HEADER_TRANSLATIONS.get(target_lang, {}).get('section_word', 'Section')} 11(2)').",
        f"2. Keep the exact delimiter tags (<<<TAG_NAME>>>) strictly intact.",
        f"3. Return ONLY the translated sections with their tags; do NOT include introductory notes or explanations.\n"
    ]

    has_content = False

    if payload_to_translate.get("answer"):
        prompt_parts.append(f"<<<ANSWER>>>\n{payload_to_translate['answer']}")
        has_content = True

    if payload_to_translate.get("answerSimple"):
        prompt_parts.append(f"<<<SIMPLE>>>\n{payload_to_translate['answerSimple']}")

    if payload_to_translate.get("evidence_reasons"):
        reasons_text = "\n".join(str(r) for r in payload_to_translate["evidence_reasons"] if r)
        prompt_parts.append(f"<<<REASONS>>>\n{reasons_text}")

    if payload_to_translate.get("pathway_authority"):
        prompt_parts.append(f"<<<AUTHORITY>>>\n{payload_to_translate['pathway_authority']}")

    if payload_to_translate.get("pathway_deadline"):
        prompt_parts.append(f"<<<DEADLINE>>>\n{payload_to_translate['pathway_deadline']}")

    steps = payload_to_translate.get("pathway_steps", [])
    for i, s in enumerate(steps):
        if isinstance(s, dict):
            prompt_parts.append(f"<<<STEP_{i}_TITLE>>>\n{s.get('title', '')}")
            prompt_parts.append(f"<<<STEP_{i}_DETAIL>>>\n{s.get('detail', '')}")
            docs_list = s.get("docs", [])
            if docs_list:
                prompt_parts.append(f"<<<STEP_{i}_DOCS>>>\n" + "\n".join(str(d) for d in docs_list))

    if not has_content:
        return payload_to_translate

    batch_user_prompt = "\n\n".join(prompt_parts)

    # 3. Primary Execution: Batched Groq LLM
    try:
        raw_output = _call_groq_text(
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert Indian statutory translator for {lang_name}. Follow delimiter tag rules strictly."
                },
                {"role": "user", "content": batch_user_prompt}
            ],
            temperature=0.1,
            max_tokens=3000,
        )

        if raw_output:
            # Parse Delimited Tags
            tag_matches = re.findall(r'<<<([A-Z0-9_]+)>>>\s*([\s\S]*?)(?=(?:<<<[A-Z0-9_]+>>>|\Z))', raw_output)
            tags_dict = {k.strip(): v.strip() for k, v in tag_matches}

            out: Dict[str, Any] = {}
            if "ANSWER" in tags_dict:
                out["answer"] = tags_dict["ANSWER"]
            if "SIMPLE" in tags_dict:
                out["answerSimple"] = tags_dict["SIMPLE"]
            if "REASONS" in tags_dict:
                out["evidence_reasons"] = [r.strip() for r in tags_dict["REASONS"].split("\n") if r.strip()]
            if "AUTHORITY" in tags_dict:
                out["pathway_authority"] = tags_dict["AUTHORITY"]
            if "DEADLINE" in tags_dict:
                out["pathway_deadline"] = tags_dict["DEADLINE"]

            if steps:
                out["pathway_steps"] = []
                for i, s in enumerate(steps):
                    if isinstance(s, dict):
                        title_val = tags_dict.get(f"STEP_{i}_TITLE", s.get("title", ""))
                        detail_val = tags_dict.get(f"STEP_{i}_DETAIL", s.get("detail", ""))
                        docs_val_raw = tags_dict.get(f"STEP_{i}_DOCS")
                        if docs_val_raw:
                            docs_val = [d.strip() for d in docs_val_raw.split("\n") if d.strip()]
                        else:
                            docs_val = s.get("docs", [])
                        out["pathway_steps"].append({
                            "title": title_val,
                            "detail": detail_val,
                            "docs": docs_val,
                        })
                    else:
                        out["pathway_steps"].append(s)

            # Localize citations deterministically
            sec_word = HEADER_TRANSLATIONS.get(target_lang, {}).get("section_word", "Section")
            jur_map = JURISDICTION_NATIVE.get(target_lang, {})
            citations = payload_to_translate.get("citations", [])
            if citations:
                out["citations"] = []
                for c in citations:
                    if isinstance(c, dict):
                        raw_sec = c.get("section", "")
                        clean_sec = re.sub(r'^(?:Section|Sec\.|Sec|பிரிவு|धारा|విభాగం|ವಿಭಾಗ|कलम)\s*', '', raw_sec, flags=re.IGNORECASE)
                        formatted_sec = f"{sec_word} {clean_sec}" if clean_sec else raw_sec
                        jur_key = (c.get("jurisdiction") or "").lower()
                        formatted_jur = jur_map.get(jur_key, c.get("jurisdiction", ""))
                        out["citations"].append({
                            "act": c.get("act", ""),
                            "section": formatted_sec,
                            "jurisdiction": formatted_jur,
                        })
                    else:
                        out["citations"].append(c)

            cleaned_result = _apply_cleanup(out, target_lang)
            _set_cache(cache_key, json.dumps(cleaned_result, ensure_ascii=False))
            logger.info("Batched Groq translation to %s succeeded in 1 call.", lang_name)
            return cleaned_result

    except Exception as e:
        logger.error("Batched Groq translation encountered error: %s", e)

    # 4. Secondary Fallback: Deep-Translator string-by-string
    try:
        logger.info("Attempting secondary fallback for %s...", lang_name)
        fb_answer = _call_deep_translator(payload_to_translate.get("answer", ""), target_lang)
        if fb_answer:
            out_fb = dict(payload_to_translate)
            out_fb["answer"] = fb_answer
            if payload_to_translate.get("answerSimple"):
                out_fb["answerSimple"] = _call_deep_translator(payload_to_translate["answerSimple"], target_lang) or payload_to_translate["answerSimple"]
            return _apply_cleanup(out_fb, target_lang)
    except Exception as fb_err:
        logger.error("Secondary translation fallback error: %s", fb_err)

    # 5. Graceful Degradation: return English with statutory cleanup so user is NEVER blocked
    logger.warning("All translation engines unavailable; gracefully returning English case sheet.")
    return _apply_cleanup(payload_to_translate, target_lang)


# ── Formal Legal Notice Translation ─────────────────────────────────────────────

def translate_notice_letter(letter_text: str, target_lang: str) -> str:
    """
    Translates a formal notice letter completely into the target Indian language.
    Produces a 100% native language legal notice without English placeholders.
    """
    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES or not letter_text.strip():
        return letter_text

    cache_key = f"letter_v2_{target_lang}_{hash(letter_text[:140])}"
    cached = _get_cache(cache_key)
    if cached:
        return cached

    headers = HEADER_TRANSLATIONS.get(target_lang, {})
    date_word = headers.get("date", "Date:")
    to_word = headers.get("to", "To,")
    subj_word = headers.get("subject", "Subject:")
    salut_word = headers.get("salutation", "Dear Sir / Madam,")
    close_word = headers.get("closing", "Yours sincerely,")
    sec_word = headers.get("section_word", "Section")

    def _letter_cleanup(text: str) -> str:
        # Normalize header labels
        text = re.sub(r'\bDate:', date_word, text)
        text = re.sub(r'\bTo,', to_word, text)
        text = re.sub(r'\bSubject:', subj_word, text)
        text = re.sub(r'Dear Sir\s*/\s*Madam,', salut_word, text, flags=re.IGNORECASE)
        text = re.sub(r'Yours sincerely,', close_word, text, flags=re.IGNORECASE)
        text = re.sub(r'\bSection\b', sec_word, text)
        
        # Replace erroneous "Sender" label at the top with "Recipient" label
        if target_lang == "ta":
            text = re.sub(r'^\s*அனுப்புநர்\s*,?\s*\n(?=\s*\[?(?:நிறுவனம்|முதலாளி|Employer|Company))', f"{to_word}\n", text, flags=re.MULTILINE)

        # Deterministically replace any leftover English placeholders with native language
        placeholders = PLACEHOLDER_TRANSLATIONS.get(target_lang, [])
        for eng_ph, local_ph in placeholders:
            text = text.replace(eng_ph, local_ph)
            inner_eng = eng_ph.strip("[]")
            inner_local = local_ph.strip("[]")
            text = re.sub(re.escape(inner_eng), inner_local, text, flags=re.IGNORECASE)

        return text

    lang_name = SUPPORTED_LANGUAGES[target_lang]["name"]

    # 1. Primary: Groq LLM (1 call, 100% regional translation including placeholders)
    res = _call_groq_text(
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are a professional legal drafting assistant specializing in Indian statutory notices. "
                    f"Translate the following legal notice completely into 100% formal {lang_name} native script. "
                    f"CRITICAL REQUIREMENTS:\n"
                    f"1. 100% REGIONAL LANGUAGE: Every single word must be in {lang_name} native script. Do NOT leave English text anywhere.\n"
                    f"2. BRACKETED PLACEHOLDERS: Translate the descriptive text INSIDE every square bracket placeholder into {lang_name} (e.g. translate '[Employer / Company / Landlord Full Legal Name]' to '[{PLACEHOLDER_TRANSLATIONS.get(target_lang, [('', '')])[0][1].strip('[]')}]', '[Contact Number & Email ID]' to '[{PLACEHOLDER_TRANSLATIONS.get(target_lang, [('', '')])[10][1].strip('[]')}]'). Keep the square brackets [...] around the placeholder.\n"
                    f"3. FORMATTING: Preserve the formal legal letter layout (Date, Recipient / To, Subject, Salutation, Body paragraphs, Demand deadline, Closing, Sender signature block).\n"
                    f"Return ONLY the translated notice letter."
                )
            },
            {"role": "user", "content": letter_text}
        ],
        temperature=0.1,
        max_tokens=3500,
    )

    if res:
        cleaned = _letter_cleanup(res)
        _set_cache(cache_key, cleaned)
        return cleaned

    # 2. Secondary Fallback: Deep-Translator
    dt_res = _call_deep_translator(letter_text, target_lang)
    if dt_res:
        cleaned = _letter_cleanup(dt_res)
        _set_cache(cache_key, cleaned)
        return cleaned

    # 3. Graceful fallback: original letter with cleaned placeholders
    return _letter_cleanup(letter_text)


# ── Language Detection & Ingress Translation ────────────────────────────────────

def detect_language(text: str, user_preference: Optional[str] = None) -> str:
    """
    Detects language using fast Unicode script range inspection.
    Supports: ta (Tamil), hi (Hindi), kn (Kannada), mr (Marathi), te (Telugu), en (English).
    """
    if not text:
        return user_preference if user_preference in SUPPORTED_LANGUAGES else "en"

    counts = {"ta": 0, "kn": 0, "te": 0, "devanagari": 0}
    for ch in text:
        cp = ord(ch)
        if 0x0B80 <= cp <= 0x0BFF:
            counts["ta"] += 1
        elif 0x0C80 <= cp <= 0x0CFF:
            counts["kn"] += 1
        elif 0x0C00 <= cp <= 0x0C7F:
            counts["te"] += 1
        elif 0x0900 <= cp <= 0x097F:
            counts["devanagari"] += 1

    max_indic = max(counts, key=counts.get)
    if counts[max_indic] >= 2 or (counts[max_indic] >= 1 and len(text.strip()) <= 15):
        if max_indic == "devanagari":
            if user_preference in ("mr", "hi"):
                return user_preference
            marathi_markers = {"आहे", "नाही", "झाले", "गेलो", "करणे", "केले", "पाहिजे", "महिने", "पगार"}
            words = set(text.split())
            if any(w in words for w in marathi_markers):
                return "mr"
            return "hi"
        return max_indic

    if user_preference and user_preference in SUPPORTED_LANGUAGES and user_preference != "en":
        return user_preference

    return "en"


def translate_to_english(text: str, source_lang: Optional[str] = None) -> tuple[str, str]:
    """
    Ingress translation for the English Internal Hub.
    Translates user grievances, statements, or clarification answers into clear,
    factual English suitable for downstream statutory classification and retrieval.
    Returns: (english_text, detected_language)
    """
    if not text or not text.strip():
        return text, "en"

    cleaned_input = text.strip()

    # If pure numeric/punctuation, no translation needed
    if _is_pure_numeric_or_trivial(cleaned_input):
        return cleaned_input, (source_lang or "en")

    detected_lang = detect_language(cleaned_input, source_lang)
    if detected_lang == "en":
        return cleaned_input, "en"

    # Check cache
    cache_key = f"ingress_en_{hash(cleaned_input)}"
    cached = _get_cache(cache_key)
    if cached:
        return cached, detected_lang

    lang_name = SUPPORTED_LANGUAGES.get(detected_lang, {}).get("name", detected_lang)

    # 1. Primary: Groq LLM
    res = _call_groq_text(
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are a legal translator. Translate this user statement from {lang_name} into clear, concise English. "
                    f"Return ONLY the English translation without quotes, notes, or explanations."
                )
            },
            {"role": "user", "content": cleaned_input}
        ],
        temperature=0.0,
        max_tokens=1024,
    )

    if res:
        out = res.strip().strip('"').strip("'")
        _set_cache(cache_key, out)
        return out, detected_lang

    # 2. Secondary Fallback: Deep-Translator
    dt_res = _call_deep_translator(cleaned_input, "en", detected_lang)
    if dt_res:
        out = dt_res.strip()
        _set_cache(cache_key, out)
        return out, detected_lang

    # 3. Graceful fallback: return original text
    return cleaned_input, detected_lang
