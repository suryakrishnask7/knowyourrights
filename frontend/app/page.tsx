"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Homepage from "./components/Homepage";
import LanguageDropdown from "./components/LanguageDropdown";
import { UI_TRANSLATIONS, LOCALIZED_EXAMPLES } from "./translations";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SHOW_DEBUG = process.env.NEXT_PUBLIC_SHOW_DEBUG === "true";
const MAX_TURNS = 2;

type AppState = "HOME" | "EMPTY" | "LOADING" | "CLARIFICATION" | "RESULT";
type StateCode = "TN" | "MH" | "KA";
type Citation    = { act: string; section: string; jurisdiction: string };
type Evidence    = { level: "High" | "Medium" | "Low"; reasons: string[] };
type PathwayStep = { title: string; detail: string; docs?: string[] };
type Pathway     = { authority: string; deadlineNote: string; steps: PathwayStep[] };
type QueryResult = {
  answer: string; answerSimple?: string; citations: Citation[]; evidence: Evidence;
  pathway: Pathway; detectedCategory: string | null; ragDebug?: unknown;
  needsClarification?: boolean; clarifyingQuestion?: string; clarifyingReason?: string;
  turnCount?: number; maxTurns?: number; hasDirectRecourse?: boolean;
  letterEligible?: boolean; user_name?: string;
  facts?: Record<string, unknown>; clarification_round?: number; asked_facts?: string[]; original_query?: string;
  detected_language?: string;
  translated?: {
    answer: string;
    answerSimple?: string;
    evidence_reasons?: string[];
    pathway_authority?: string;
    pathway_deadline?: string;
    pathway_steps?: PathwayStep[];
    citations?: Citation[];
  };
};

function detectClientLanguage(text: string): string {
  if (!text) return "en";
  let ta = 0, kn = 0, te = 0, dev = 0;
  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    if (cp >= 0x0B80 && cp <= 0x0BFF) ta++;
    else if (cp >= 0x0C80 && cp <= 0x0CFF) kn++;
    else if (cp >= 0x0C00 && cp <= 0x0C7F) te++;
    else if (cp >= 0x0900 && cp <= 0x097F) dev++;
  }
  const max = Math.max(ta, kn, te, dev);
  if (max >= 2 || (max >= 1 && text.trim().length <= 15)) {
    if (max === ta) return "ta";
    if (max === kn) return "kn";
    if (max === te) return "te";
    if (max === dev) return "hi";
  }
  return "en";
}

const SECTION_WORD: Record<string, string> = {
  en: "Section",
  ta: "பிரிவு",
  hi: "धारा",
  kn: "ವಿಭಾಗ",
  mr: "कलम",
  te: "విభాగం",
};

const JURISDICTION_WORD: Record<string, Record<string, string>> = {
  en: { central: "CENTRAL", state: "STATE", tn: "TAMIL NADU", mh: "MAHARASHTRA", ka: "KARNATAKA" },
  ta: { central: "மத்திய அரசு", state: "மாநில அரசு", tn: "தமிழ்நாடு", mh: "மகாராஷ்டிரா", ka: "கர்நாடகா" },
  hi: { central: "केन्द्रीय", state: "राज्य", tn: "तमिलनाडु", mh: "महाराष्ट्र", ka: "कर्नाटक" },
  kn: { central: "ಕೇಂದ್ರ", state: "ರಾಜ್ಯ", tn: "ತಮಿಳುನಾಡು", mh: "ಮಹಾರಾಷ್ಟ್ರ", ka: "ಕರ್ನಾಟಕ" },
  mr: { central: "केंद्रीय", state: "राज्य", tn: "तमिळनाडू", mh: "महाराष्ट्र", ka: "कर्नाटक" },
  te: { central: "కేంద్ర", state: "రాష్ట్ర", tn: "తమిళనాడు", mh: "మహారాష్ట్ర", ka: "కర్ణాటక" },
};

export const LOCALIZED_STATE_LABELS: Record<string, Record<StateCode, string>> = {
  en: { TN: "Tamil Nadu", MH: "Maharashtra", KA: "Karnataka" },
  ta: { TN: "தமிழ்நாடு", MH: "மகாராஷ்டிரா", KA: "கர்நாடகா" },
  hi: { TN: "तमिलनाडु", MH: "महाराष्ट्र", KA: "कर्नाटक" },
  te: { TN: "తమిళనాడు", MH: "మహారాష్ట్ర", KA: "కర్ణాటక" },
  kn: { TN: "ತಮಿಳುನಾಡು", MH: "ಮಹಾರಾಷ್ಟ್ರ", KA: "ಕರ್ನಾಟಕ" },
  mr: { TN: "तमिळनाडू", MH: "महाराष्ट्र", KA: "कर्नाटक" },
};

const STATE_LABELS: Record<StateCode, string> = LOCALIZED_STATE_LABELS.en;

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ta", label: "தமிழ்", name: "Tamil" },
  { code: "hi", label: "हिन्दी", name: "Hindi" },
  { code: "kn", label: "ಕನ್ನಡ", name: "Kannada" },
  { code: "mr", label: "मराठी", name: "Marathi" },
  { code: "te", label: "తెలుగు", name: "Telugu" },
];

const STATUTORY_RECORDS_LABELS: Record<string, string> = {
  en: "REQUIRED STATUTORY RECORDS",
  ta: "தேவையான சட்ட ஆவணங்கள்",
  hi: "आवश्यक वैधानिक दस्तावेज",
  kn: "ಅಗತ್ಯವಿರುವ ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳು",
  mr: "आवश्यक वैधानिक कागदपत्रे",
  te: "అవసరమైన చట్టబద్ధమైన రికార్డులు",
};

const NOTICE_UI: Record<string, {
  badge: string;
  heading: string;
  desc: string;
  nameLabel: string;
  nameSub: string;
  previewBtn: string;
  previewHeading: string;
  downloadBtn: string;
  hideForm: string;
  createBtn: string;
  generating: string;
}> = {
  en: {
    badge: "§ FORMAL NOTICE DRAFT",
    heading: "Want a ready-to-send notice letter?",
    desc: "Generate an official legal notice citing verified statutes. Personal fields are processed locally and never sent to any AI.",
    nameLabel: "YOUR FULL LEGAL NAME",
    nameSub: "All other fields in the letter (recipient, addresses, claim amounts) are populated with standard bracketed placeholders for you to fill in or review.",
    previewBtn: "PREVIEW NOTICE LETTER",
    previewHeading: "NOTICE LETTER PREVIEW",
    downloadBtn: "DOWNLOAD NOTICE LETTER (.DOCX)",
    hideForm: "HIDE FORM [-]",
    createBtn: "+ CREATE NOTICE LETTER",
    generating: "GENERATING..."
  },
  ta: {
    badge: "§ அதிகாரப்பூர்வ சட்ட அறிவிப்பு வரைவு",
    heading: "உடனடியாக அனுப்பக்கூடிய சட்ட அறிவிப்பு கடிதம் வேண்டுமா?",
    desc: "சரிபார்க்கப்பட்ட சட்டப் பிரிவுகளைக் குறிப்பிட்டு அதிகாரப்பூர்வ சட்ட அறிவிப்பை உருவாக்கவும். உங்கள் விவரங்கள் உள்ளூரிலேயே செயலாக்கப்படும்.",
    nameLabel: "உங்கள் முழுமையான சட்டப்பூர்வ பெயர்",
    nameSub: "கடிதத்தில் உள்ள பிற அனைத்து புலங்களும் (பெறுநர், முகவரிகள், கோரிக்கை தொகைகள்) நீங்கள் மதிப்பாய்வு செய்ய நிலையான அடைப்புக்குறி ஒதுக்கிடங்களுடன் நிரப்பப்படும்.",
    previewBtn: "அறிவிப்பு கடிதத்தை பார்க்கவும்",
    previewHeading: "சட்ட அறிவிப்பு கடித முன்னோட்டம்",
    downloadBtn: "சட்ட அறிவிப்பை பதிவிறக்கவும் (.DOCX)",
    hideForm: "படிவத்தை மறைக்கவும் [-]",
    createBtn: "+ சட்ட அறிவிப்பு கடிதம் உருவாக்கவும்",
    generating: "உருவாக்குகிறது..."
  },
  hi: {
    badge: "§ औपचारिक कानूनी नोटिस प्रारूप",
    heading: "क्या आप तैयार कानूनी नोटिस पत्र चाहते हैं?",
    desc: "सत्यापित कानूनों का हवाला देते हुए एक आधिकारिक कानूनी नोटिस तैयार करें। व्यक्तिगत विवरण स्थानीय रूप से संसाधित होते हैं।",
    nameLabel: "आपका पूरा कानूनी नाम",
    nameSub: "पत्र के अन्य सभी क्षेत्र मानक कोष्ठक प्लेसहोल्डर्स के साथ भरे जाते हैं ताकि आप उनकी समीक्षा कर सकें।",
    previewBtn: "नोटिस पत्र पूर्वावलोकन देखें",
    previewHeading: "कानूनी नोटिस पत्र पूर्वावलोकन",
    downloadBtn: "नोटिस पत्र डाउनलोड करें (.DOCX)",
    hideForm: "फॉर्म छुपाएं [-]",
    createBtn: "+ कानूनी नोटिस पत्र बनाएं",
    generating: "तैयार हो रहा है..."
  },
  kn: {
    badge: "§ ಅಧಿಕೃತ ಕಾನೂನು ನೋಟಿಸ್ ಕರಡು",
    heading: "ಕಳುಹಿಸಲು ಸಿದ್ಧವಾಗಿರುವ ನೋಟಿಸ್ ಪತ್ರ ಬೇಕೇ?",
    desc: "ಪರಿಶೀಲಿಸಿದ ಕಾನೂನುಗಳನ್ನು ಉಲ್ಲೇಖಿಸಿ ಅಧಿಕೃತ ಕಾನೂನು ನೋಟಿಸ್ ರಚಿಸಿ. ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಸಂಸ್ಕರಿಸಲಾಗುತ್ತದೆ.",
    nameLabel: "ನಿಮ್ಮ ಪೂರ್ಣ ಕಾನೂನು ಹೆಸರು",
    nameSub: "ಪತ್ರದಲ್ಲಿನ ಎಲ್ಲಾ ಇತರ ಕ್ಷೇತ್ರಗಳನ್ನು ನೀವು ಪರಿಶೀಲಿಸಲು ಮಾನದಂಡದ ಬ್ರಾಕೆಟ್ ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್‌ಗಳೊಂದಿಗೆ ಭರ್ತಿ ಮಾಡಲಾಗುತ್ತದೆ.",
    previewBtn: "ನೋಟಿಸ್ ಪತ್ರ ಮುನ್ನೋಟ ವೀಕ್ಷಿಸಿ",
    previewHeading: "ಕಾನೂನು ನೋಟಿಸ್ ಪತ್ರ ಮುನ್ನೋಟ",
    downloadBtn: "ನೋಟಿಸ್ ಪತ್ರ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.DOCX)",
    hideForm: "ಫಾರ್ಮ್ ಮರೆಮಾಡಿ [-]",
    createBtn: "+ ಕಾನೂನು ನೋಟಿಸ್ ಪತ್ರ ರಚಿಸಿ",
    generating: "ರಚಿಸಲಾಗುತ್ತಿದೆ..."
  },
  mr: {
    badge: "§ औपचारिक कायदेशीर नोटीस मसुदा",
    heading: "पाठवण्यासाठी तयार कायदेशीर नोटीस हवी आहे का?",
    desc: "पडताळणी केलेल्या कायद्यांचा संदर्भ देऊन अधिकृत कायदेशीर नोटीस तयार करा. वैयक्तिक तपशील स्थानिक पातळीवर प्रक्रिया केले जातात.",
    nameLabel: "आपले पूर्ण कायदेशीर नाव",
    nameSub: "पत्रातील इतर सर्व माहिती आपण पुनरावलोकन करण्यासाठी मानक कंसामध्ये भरली जाते.",
    previewBtn: "नोटीस पत्राचे पूर्वावलोकन पहा",
    previewHeading: "कायदेशीर नोटीस पूर्वावलोकन",
    downloadBtn: "नोटीस पत्र डाउनलोड करा (.DOCX)",
    hideForm: "फॉर्म लपवा [-]",
    createBtn: "+ कायदेशीर नोटीस पत्र तयार करा",
    generating: "तयार होत आहे..."
  },
  te: {
    badge: "§ అధికారిక చట్టపరమైన నోటీసు చిత్తుప్రతి",
    heading: "పంపడానికి సిద్ధంగా ఉన్న నోటీసు లేఖ కావాలా?",
    desc: "ధృవీకరించబడిన చట్టాలను ప్రస్తావిస్తూ అధికారిక చట్టపరమైన నోటీసును రూపొందించండి. వ్యక్తిగత వివరాలు స్థానికంగా ప్రాసెస్ చేయబడతాయి.",
    nameLabel: "మీ పూర్తి చట్టపరమైన పేరు",
    nameSub: "లేఖలోని ఇతర అన్ని వివరాలు మీరు సమీక్షించడానికి ప్రామాణిక బ్రాకెట్ ప్లేస్‌హోల్డర్‌లతో నింపబడతాయి.",
    previewBtn: "నోటీసు లేఖ ముందస్తు వీక్షణ",
    previewHeading: "చట్టపరమైన నోటీసు లేఖ ముందస్తు వీక్షణ",
    downloadBtn: "నోటీసు లేఖను డౌన్‌లోడ్ చేయండి (.DOCX)",
    hideForm: "ఫారమ్‌ను దాచండి [-]",
    createBtn: "+ చట్టపరమైన నోటీసు లేఖను సృష్టించండి",
    generating: "రూపొందిస్తోంది..."
  }
};

const SECTION_HEADERS: Record<string, {
  provisions: string;
  evidence: string;
  pathway: string;
  authority: string;
  deadline: string;
  actionSteps: string;
  reportedFacts: string;
  legalPosition: string;
  detailedMode: string;
  simpleMode: string;
  caseSheet: string;
  verifiedBadge: string;
  exportPdf: string;
  newQuery: string;
  confidence: string;
  home: string;
  howItWorks: string;
  history: string;
}> = {
  en: {
    provisions: "APPLICABLE STATUTORY PROVISIONS",
    evidence: "EVIDENCE PRECONDITION ANALYSIS",
    pathway: "NEXT STEPS & PROCEDURAL PATHWAY",
    authority: "AUTHORITY TO APPROACH",
    deadline: "STATUTORY DEADLINE",
    actionSteps: "ACTION STEPS",
    reportedFacts: "WHAT YOU REPORTED",
    legalPosition: "LEGAL POSITION & STATUTORY SUMMARY",
    detailedMode: "DETAILED STATUTORY",
    simpleMode: "SIMPLER WORDING",
    caseSheet: "LEGAL CASE SHEET",
    verifiedBadge: "VERIFIED STATUTES",
    exportPdf: "EXPORT TO PDF",
    newQuery: "+ NEW QUERY",
    confidence: "CONFIDENCE",
    home: "Home",
    howItWorks: "How it works",
    history: "History",
  },
  ta: {
    provisions: "பொருந்தக்கூடிய சட்ட விதிகள்",
    evidence: "சான்றுகள் மற்றும் நிபந்தனைகள் பகுப்பாய்வு",
    pathway: "அடுத்த கட்ட சட்ட நடைமுறைகள்",
    authority: "அணுக வேண்டிய சட்ட அதிகாரம்",
    deadline: "சட்டரீதியான காலக்கெடு",
    actionSteps: "செயல்பாட்டு படிகள்",
    reportedFacts: "நீங்கள் தெரிவித்தது",
    legalPosition: "சட்ட நிலைப்பாடு & சட்டரீதியான சுருக்கம்",
    detailedMode: "விரிவான சட்ட விளக்கம்",
    simpleMode: "எளிய வார்த்தைகள்",
    caseSheet: "சட்ட வழக்கு தாள்",
    verifiedBadge: "சரிபார்க்கப்பட்ட சட்டங்கள்",
    exportPdf: "PDF ஆக ஏற்றுமதி",
    newQuery: "+ புதிய கேள்வி",
    confidence: "நம்பகத்தன்மை",
    home: "முகப்பு",
    howItWorks: "எவ்வாறு செயல்படுகிறது",
    history: "வரலாறு",
  },
  hi: {
    provisions: "लागू होने वाले वैधानिक प्रावधान",
    evidence: "साक्ष्य एवं पूर्वशर्त विश्लेषण",
    pathway: "अगले कदम एवं प्रक्रियात्मक मार्ग",
    authority: "संपर्क करने योग्य कानूनी प्राधिकरण",
    deadline: "वैधानिक समय सीमा",
    actionSteps: "कार्रवाई के कदम",
    reportedFacts: "आपने क्या बताया",
    legalPosition: "कानूनी स्थिति एवं वैधानिक सारांश",
    detailedMode: "विस्तृत वैधानिक",
    simpleMode: "सरल भाषा",
    caseSheet: "कानूनी केस शीट",
    verifiedBadge: "सत्यापित क़ानून",
    exportPdf: "PDF में निर्यात",
    newQuery: "+ नई क्वेरी",
    confidence: "साक्ष्य स्तर",
    home: "मुख्य पृष्ठ",
    howItWorks: "यह कैसे काम करता है",
    history: "इतिहास",
  },
  kn: {
    provisions: "ಅನ್ವಯವಾಗುವ ಶಾಸನಬದ್ಧ ನಿಬಂಧನೆಗಳು",
    evidence: "ಪುರಾವೆ ಪೂರ್ವಾಪೇಕ್ಷಿತ ವಿಶ್ಲೇಷಣೆ",
    pathway: "ಮುಂದಿನ ಹಂತಗಳು ಮತ್ತು ಕಾರ್ಯವಿಧಾನದ ಮಾರ್ಗ",
    authority: "ಸಂಪರ್ಕಿಸಬೇಕಾದ ಪ್ರಾಧಿಕಾರ",
    deadline: "ಶಾಸನಬದ್ಧ ಗಡುವು",
    actionSteps: "ಕ್ರಮದ ಹಂತಗಳು",
    reportedFacts: "ನೀವು ವರದಿ ಮಾಡಿದ್ದು",
    legalPosition: "ಕಾನೂನು ನಿಲುವು & ಶಾಸನಬದ್ಧ ಸಾರಾಂಶ",
    detailedMode: "ವಿವರವಾದ ಶಾಸನಬದ್ಧ",
    simpleMode: "ಸರಳ ಭಾಷೆ",
    caseSheet: "ಕಾನೂನು ಪ್ರಕರಣ ಹಾಳೆ",
    verifiedBadge: "ಪರಿಶೀಲಿಸಿದ ಕಾನೂನುಗಳು",
    exportPdf: "PDF ಗೆ ರಫ್ತು",
    newQuery: "+ ಹೊಸ ಪ್ರಶ್ನೆ",
    confidence: "ಸಾಕ್ಷ್ಯ ಮಟ್ಟ",
    home: "ಮುಖಪುಟ",
    howItWorks: "ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
    history: "ಇತಿಹಾಸ",
  },
  mr: {
    provisions: "लागू कायदेशीर तरतुदी",
    evidence: "पुराव्याची पूर्वअट विश्लेषण",
    pathway: "पुढील पावले आणि प्रक्रियात्मक मार्ग",
    authority: "संपर्क साधण्याचे प्राधिकरण",
    deadline: "कायदेशीर अंतिम मुदत",
    actionSteps: "कृतीची पावले",
    reportedFacts: "तुम्ही काय सांगितले",
    legalPosition: "कायदेशीर स्थिती आणि वैधानिक सारांश",
    detailedMode: "तपशीलवार वैधानिक",
    simpleMode: "सोप्या शब्दांत",
    caseSheet: "कायदेशीर केस शीट",
    verifiedBadge: "सत्यापित कायदे",
    exportPdf: "PDF म्हणून निर्यात",
    newQuery: "+ नवीन प्रश्न",
    confidence: "पुरावा पातळी",
    home: "मुख्यपृष्ठ",
    howItWorks: "हे कसे कार्य करते",
    history: "इतिहास",
  },
  te: {
    provisions: "వర్తించే చట్టబద్ధమైన నిబంధనలు",
    evidence: "సాక్ష్యాల పూర్వపరిస్థితి విశ్లేషణ",
    pathway: "తదుపరి దశలు & విధానపరమైన మార్గం",
    authority: "సంప్రదించాల్సిన అధికారం",
    deadline: "చట్టబద్ధమైన గడువు",
    actionSteps: "చర్య దశలు",
    reportedFacts: "మీరు నివేదించింది",
    legalPosition: "చట్టపరమైన స్థితి & చట్టబద్ధమైన సారాంశం",
    detailedMode: "వివరణాత్మక చట్టబద్ధమైన",
    simpleMode: "సరళమైన పదాలు",
    caseSheet: "చట్టపరమైన కేసు షీట్",
    verifiedBadge: "ధృవీకరించిన చట్టాలు",
    exportPdf: "PDF కి ఎగుమతి",
    newQuery: "+ కొత్త ప్రశ్న",
    confidence: "సాక్ష్య స్థాయి",
    home: "హోమ్",
    howItWorks: "ఇది ఎలా పని చేస్తుంది",
    history: "చరిత్ర",
  },
};

const PIPELINE_STEPS = [
  "Processing statement & jurisdiction parameters",
  "Identifying applicable statutory category",
  "Retrieving Central & State statutory provisions",
  "Evaluating evidence confidence & preconditions",
  "Structuring procedural pathway & legal recourse",
];

const EXAMPLE_QUERIES = [
  { ref: "EXAMPLE 01", label: "UNPAID OVERTIME", text: "My company makes me work 12 hours every day, but refuses to pay overtime wages." },
  { ref: "EXAMPLE 02", label: "GRATUITY WITHHELD", text: "I resigned after 5 years of continuous service, but my company is refusing to pay my gratuity." },
  { ref: "EXAMPLE 03", label: "UNLAWFUL EVICTION", text: "My landlord disconnected our electricity and water to force us out without a court order." },
  { ref: "EXAMPLE 04", label: "MATERNITY BENEFIT", text: "My employer dismissed me after I applied for statutory 26-week paid maternity leave." },
];

function renderText(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.msg === "string") return obj.msg;
    if (typeof obj.title === "string") return obj.title;
    if (typeof obj.detail === "string") return obj.detail;
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function HowItWorksModal({ open, onClose, lang = "en" }: { open: boolean; onClose: () => void; lang?: string }) {
  if (!open) return null;
  const t = (UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en).howItWorksModal;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-6 relative animate-fade-up shadow-xl rounded-none" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-3)] hover:text-[var(--text-1)] text-xs font-mono cursor-pointer">{t.close}</button>
        <div className="border-b border-[var(--border)] pb-3 mb-4">
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[var(--text-3)] mb-0.5">{t.subtitle}</p>
          <h3 className="text-xl font-serif font-bold text-[var(--text-1)]">{t.title}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
          {t.steps.map((item, idx) => (
            <div key={item.num} className={`p-3.5 border border-[var(--border)] bg-[var(--bg-subtle)] rounded-none ${idx === 4 ? "sm:col-span-2" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-[var(--accent-crimson)]">{item.num}</span>
                <span className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wide font-sans">{item.title}</span>
              </div>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingChecklist({ step, lang = "en" }: { step: number; lang?: string }) {
  const t = (UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en).loading;
  return (
    <div className="w-full max-w-md mx-auto py-10 px-8 border border-[var(--border)] bg-[var(--bg-surface)] animate-fade-up shadow-sm rounded-none">
      <div className="border-b border-[var(--border)] pb-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-amber-500 animate-ping" />
          <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase">
            {t.activeBadge}
          </p>
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--text-1)] mt-1">
          {t.heading}
        </h3>
      </div>
      <div className="space-y-4 font-sans">
        {t.steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center gap-3.5">
              <div className={`w-6 h-6 flex items-center justify-center text-xs font-mono font-bold border transition-all rounded-none ${
                done
                  ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)]"
                  : active
                  ? "bg-[var(--bg-subtle)] text-[var(--text-1)] border-[var(--border-strong)] animate-pulse"
                  : "bg-transparent text-[var(--text-4)] border-[var(--border)]"
              }`}>
                {done ? "✓" : active ? "●" : i + 1}
              </div>
              <span className={`text-xs transition-colors ${
                done ? "text-[var(--text-1)] font-semibold" : active ? "text-[var(--text-1)] font-bold" : "text-[var(--text-3)]"
              }`}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PathwayStepRow({ step, i, total, language = "en" }: { step: PathwayStep; i: number; total: number; language?: string }) {
  const [open, setOpen] = useState(i === 0);
  const numStr = (i + 1).toString().padStart(2, "0");
  const recordsLabel = STATUTORY_RECORDS_LABELS[language] || "REQUIRED STATUTORY RECORDS";
  return (
    <div className={`${i < total - 1 ? "border-b border-[var(--border)]" : ""}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full py-4 flex items-center gap-4 text-left group transition-colors">
        <span className="font-mono text-xs font-bold text-[var(--accent-crimson)]">{numStr}</span>
        <span className={`flex-1 text-base font-serif ${open ? "font-bold text-[var(--text-1)]" : "text-[var(--text-2)] group-hover:text-[var(--text-1)]"}`}>
          {renderText(step.title)}
        </span>
        <span className="text-xs font-mono text-[var(--text-3)] no-print">{open ? "[-]" : "[+]"}</span>
      </button>
      <div className={`pl-8 pb-4 space-y-3 font-sans animate-fade-up ${open ? "" : "hidden print:block"}`}>
          <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">{renderText(step.detail)}</p>
          {step.docs && step.docs.length > 0 && (
            <div className="mt-3 p-3 bg-[var(--bg-subtle)] border border-[var(--border)]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">{recordsLabel}</p>
              <ul className="space-y-1">
                {step.docs.map((d, di) => (
                  <li key={di} className="text-xs text-[var(--text-1)] font-mono flex items-center gap-2">
                    <span className="text-[var(--accent-crimson)] font-bold">—</span> {renderText(d)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );
}

function DebugPanel({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (!SHOW_DEBUG) return null;
  return (
    <div className="mt-8 border border-[var(--border)] bg-[var(--bg-subtle)] font-mono text-xs no-print">
      <button onClick={() => setOpen(o => !o)} className="w-full px-4 py-3 flex items-center justify-between text-[var(--text-2)] hover:text-[var(--text-1)]">
        <span>STATUTORY SEARCH TRACE (DEBUG)</span>
        <span>{open ? "HIDE [-]" : "SHOW [+]"}</span>
      </button>
      {open && (
        <pre className="p-4 border-t border-[var(--border)] overflow-x-auto max-h-96 text-[var(--text-1)]">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}


type HistoryItem = {
  id: string;
  timestamp: number;
  originalQuery: string;
  stateCode: StateCode;
  category: string | null;
  language: string;
  result: QueryResult;
  translations?: Record<string, unknown>;
};

function HistoryModal({
  open,
  onClose,
  history,
  onSelectHistory,
  onClearHistory,
  onDeleteHistoryItem,
  lang = "en",
}: {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  lang?: string;
}) {
  if (!open) return null;
  const t = (UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en).historyModal;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-6 relative animate-fade-up shadow-xl flex flex-col max-h-[85vh] rounded-none" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-3)] hover:text-[var(--text-1)] text-xs font-mono cursor-pointer">
          {t.close}
        </button>
        <div className="border-b border-[var(--border)] pb-3 mb-4">
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[var(--text-3)] mb-0.5">
            {t.subtitle}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-serif font-bold text-[var(--text-1)]">
              {t.title}
            </h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[10px] font-mono text-[var(--accent-crimson)] hover:underline cursor-pointer"
              >
                {t.clearAll}
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center font-sans">
            <p className="font-serif italic text-base text-[var(--text-3)]">{t.emptyTitle}</p>
            <p className="text-xs text-[var(--text-4)] mt-1 font-mono">{t.emptyDesc}</p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-3 font-sans pr-1">
            {history.map((item) => {
              const formattedDate = new Date(item.timestamp).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
              const categoryTitle = (item.category || item.result?.detectedCategory || "General Legal Query")
                .replace(/_/g, " ")
                .toUpperCase();
              return (
                <div
                  key={item.id}
                  className="p-3.5 border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--text-2)] transition-colors group relative rounded-none"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-3)] mb-1.5 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--accent-crimson)]">{categoryTitle}</span>
                      <span>·</span>
                      <span>{item.stateCode}</span>
                      <span>·</span>
                      <span className="uppercase text-[9px] px-1 bg-[var(--bg-surface)] border border-[var(--border)]">
                        {item.result?.evidence?.level || "CONFIRMED"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formattedDate}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        className="text-[var(--text-4)] hover:text-[var(--accent-crimson)] text-xs cursor-pointer ml-1"
                        title="Delete this query from history"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-1)] font-serif italic line-clamp-2 mb-2 leading-relaxed">
                    &ldquo;{item.originalQuery}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-right">
                    <span className="text-[10px] font-mono text-[var(--text-3)]">
                      {item.result?.citations?.length || 0} cited section(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectHistory(item)}
                      className="text-xs font-mono font-bold text-[var(--text-1)] hover:text-[var(--accent-crimson)] cursor-pointer"
                    >
                      {t.openBrief}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("HOME");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [stateCode, setStateCode] = useState<StateCode>("TN");
  const [query, setQuery] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [simpleWording, setSimpleWording] = useState(false);

  // Stateless clarification tracking
  const [sessionFacts, setSessionFacts] = useState<Record<string, unknown>>({});
  const [clarificationRound, setClarificationRound] = useState(0);
  const [askedFacts, setAskedFacts] = useState<string[]>([]);
  const [originalQuery, setOriginalQuery] = useState("");

  const [clarifyQ, setClarifyQ] = useState("");
  const [clarifyReason, setClarifyReason] = useState("");
  const [clarifyTurn, setClarifyTurn] = useState(1);
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [howModalOpen, setHowModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Notice letter state
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [letterFields, setLetterFields] = useState({
    employee_name: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<{ text: string; html: string } | null>(null);
  const [hasTriggeredLetterPreview, setHasTriggeredLetterPreview] = useState(false);
  const letterTranslationsRef = useRef<Record<string, { text: string; html: string }>>({});
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);

  // Translation state (supports English + 5 Indic languages)
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const currentUi = UI_TRANSLATIONS[selectedLanguage] || UI_TRANSLATIONS.en;
  const activeExamples = LOCALIZED_EXAMPLES[selectedLanguage] || LOCALIZED_EXAMPLES.en;
  const [translations, setTranslations] = useState<Record<string, {
    answer: string;
    answerSimple?: string;
    evidence_reasons?: string[];
    pathway_authority?: string;
    pathway_deadline?: string;
    pathway_steps?: PathwayStep[];
    citations?: Citation[];
  }>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Restore session & history on initial mount
  useEffect(() => {
    try {
      const savedSimple = localStorage.getItem("kyr_simple_wording");
      if (savedSimple === "true") setSimpleWording(true);

      const savedTerms = localStorage.getItem("kyr_terms_accepted");
      if (savedTerms === "true") setTermsAccepted(true);

      const savedUser = localStorage.getItem("kyr_user_name");
      if (savedUser) setUserName(savedUser);

      const savedHist = localStorage.getItem("kyr_session_history");
      if (savedHist) {
        try {
          const parsed = JSON.parse(savedHist);
          if (Array.isArray(parsed)) setHistory(parsed);
        } catch {}
      }

      const savedActive = localStorage.getItem("kyr_active_session");
      if (savedActive) {
        try {
          const sess = JSON.parse(savedActive);
          if (sess.appState && sess.appState !== "LOADING") {
            setAppState(sess.appState);
          }
          if (sess.stateCode) setStateCode(sess.stateCode);
          if (sess.query) { setQuery(sess.query); setCharCount(sess.query.length); }
          if (sess.originalQuery) setOriginalQuery(sess.originalQuery);
          if (sess.result) setResult(sess.result);
          if (sess.sessionFacts) setSessionFacts(sess.sessionFacts);
          if (sess.clarificationRound !== undefined) setClarificationRound(sess.clarificationRound);
          if (sess.askedFacts) setAskedFacts(sess.askedFacts);
          if (sess.clarifyQ) setClarifyQ(sess.clarifyQ);
          if (sess.clarifyReason) setClarifyReason(sess.clarifyReason);
          if (sess.clarifyTurn) setClarifyTurn(sess.clarifyTurn);
          if (sess.selectedLanguage) setSelectedLanguage(sess.selectedLanguage);
          if (sess.translations) setTranslations(sess.translations);
          if (sess.letterFields) setLetterFields(sess.letterFields);
          if (sess.generatedLetter) setGeneratedLetter(sess.generatedLetter);
          if (sess.hasTriggeredLetterPreview !== undefined) setHasTriggeredLetterPreview(sess.hasTriggeredLetterPreview);
        } catch (e) {
          console.error("Failed to restore active session", e);
        }
      }
    } catch {}
    setIsHydrated(true);
  }, []);

  // Save active session whenever state updates
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const activeSession = {
        appState: appState === "LOADING" ? "EMPTY" : appState,
        termsAccepted,
        stateCode,
        query,
        userName,
        originalQuery,
        result,
        sessionFacts,
        clarificationRound,
        askedFacts,
        clarifyQ,
        clarifyReason,
        clarifyTurn,
        selectedLanguage,
        translations,
        letterFields,
        generatedLetter,
        hasTriggeredLetterPreview,
      };
      localStorage.setItem("kyr_active_session", JSON.stringify(activeSession));
      if (termsAccepted) localStorage.setItem("kyr_terms_accepted", "true");
      if (userName) localStorage.setItem("kyr_user_name", userName);
    } catch {}
  }, [
    isHydrated,
    appState,
    termsAccepted,
    stateCode,
    query,
    userName,
    originalQuery,
    result,
    sessionFacts,
    clarificationRound,
    askedFacts,
    clarifyQ,
    clarifyReason,
    clarifyTurn,
    selectedLanguage,
    translations,
    letterFields,
    generatedLetter,
    hasTriggeredLetterPreview,
  ]);

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setOriginalQuery(item.originalQuery);
    setQuery(item.originalQuery);
    setStateCode(item.stateCode);
    if (item.language) setSelectedLanguage(item.language);
    if (item.translations) {
      setTranslations((prev) => ({ ...prev, ...(item.translations as typeof prev) }));
    }
    setAppState("RESULT");
    setHistoryModalOpen(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("kyr_session_history");
    } catch {}
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem("kyr_session_history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleSimple = (val: boolean) => {
    setSimpleWording(val);
    try {
      localStorage.setItem("kyr_simple_wording", String(val));
    } catch {}
  };

  const handleStartFromHomepage = () => {
    setAppState("EMPTY");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHeaderNewQuery = () => {
    if (appState === "HOME") {
      const el = document.getElementById("start");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      handleNewQuestion();
    }
  };

  const handleLogoClick = () => {
    setAppState("HOME");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewQuestion = useCallback(() => {
    setQuery(""); setCharCount(0); setClarifyAnswer("");
    setClarifyQ(""); setResult(null); setOriginalQuery(""); setError(null);
    setSessionFacts({}); setClarificationRound(0); setAskedFacts([]);
    setShowLetterForm(false); setGeneratedLetter(null); setLetterError(null); setHasTriggeredLetterPreview(false); letterTranslationsRef.current = {};
    setSelectedLanguage("en"); setTranslations({}); setIsTranslating(false); setTranslationError(null);
    setLoadingStep(0); setAppState("EMPTY");
  }, []);

  const advanceLoading = useCallback(() => {
    setLoadingStep(0);
    [400, 900, 1800, 3200, 4400].forEach((d, i) => setTimeout(() => setLoadingStep(i + 1), d));
  }, []);

  const submit = useCallback(async (
    queryText: string,
    currentFacts: Record<string, unknown>,
    currentRound: number,
    currentAskedFacts: string[],
    currentOrigQuery: string,
    overrideLang?: string
  ) => {
    setError(null); setAppState("LOADING"); advanceLoading();
    try {
      const activeLang = overrideLang || selectedLanguage;
      const res = await fetch(`${API}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          state: stateCode,
          facts: currentFacts,
          clarification_round: currentRound,
          asked_facts: currentAskedFacts,
          original_query: currentOrigQuery || queryText,
          user_name: userName.trim() || undefined,
          language: activeLang,
        }),
      });
      const data: QueryResult = await res.json();
      if (!res.ok) {
        const rawDetail = (data as unknown as { detail?: unknown }).detail;
        let errorMsg = "Request failed.";
        if (typeof rawDetail === "string") {
          errorMsg = rawDetail;
        } else if (Array.isArray(rawDetail)) {
          errorMsg = rawDetail.map((item: { msg?: string }) => item?.msg || JSON.stringify(item)).join("; ");
        } else if (rawDetail && typeof rawDetail === "object") {
          errorMsg = (rawDetail as { msg?: string }).msg || JSON.stringify(rawDetail);
        }
        setError(errorMsg);
        setAppState("EMPTY");
        return;
      }

      // Sync detected language into selector if returned
      const effectiveLang = data.detected_language || overrideLang || selectedLanguage;
      if (effectiveLang && effectiveLang !== selectedLanguage) {
        setSelectedLanguage(effectiveLang);
      }

      // If backend attached translated case sheet, store in cache immediately
      if (data.translated && effectiveLang && effectiveLang !== "en") {
        setTranslations((prev) => ({
          ...prev,
          [effectiveLang]: data.translated!,
        }));
      }
      
      if (data.facts) setSessionFacts(data.facts);
      if (data.clarification_round !== undefined) setClarificationRound(data.clarification_round);
      if (data.asked_facts) setAskedFacts(data.asked_facts);

      if (data.needsClarification) {
        setClarifyQ(data.clarifyingQuestion ?? "");
        setClarifyReason(data.clarifyingReason ?? "");
        setClarifyTurn(data.turnCount ?? 1);
        setClarifyAnswer("");
        setAppState("CLARIFICATION");
      } else {
        setResult(data);
        setGeneratedLetter(null);
        setHasTriggeredLetterPreview(false);
        letterTranslationsRef.current = {};
        if (data.user_name || userName.trim()) {
          const prefill = data.user_name || userName.trim();
          setLetterFields(prev => ({
            ...prev,
            employee_name: prev.employee_name || prefill
          }));
        }
        setAppState("RESULT");
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

        if (effectiveLang && effectiveLang !== "en" && !data.translated) {
          handleSelectLanguage(effectiveLang, data);
        }

        // Record resolved result into session history
        const histItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          originalQuery: currentOrigQuery || queryText,
          stateCode,
          category: data.detectedCategory,
          language: effectiveLang,
          result: data,
          translations: data.translated ? { [effectiveLang]: data.translated } : undefined,
        };
        setHistory((prev) => {
          const filtered = prev.filter(h => h.originalQuery.trim().toLowerCase() !== histItem.originalQuery.trim().toLowerCase());
          const updated = [histItem, ...filtered].slice(0, 20);
          try {
            localStorage.setItem("kyr_session_history", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch { setError("Could not connect to backend server. Please verify FastAPI is running at port 8000."); setAppState("EMPTY"); }
  }, [stateCode, advanceLoading, userName, selectedLanguage]);

  const handleFirstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 5) return;
    const initialText = query.trim();
    setOriginalQuery(initialText);
    const clientDetected = detectClientLanguage(initialText);
    if (clientDetected !== "en") {
      setSelectedLanguage(clientDetected);
    }
    submit(initialText, {}, 0, [], initialText, clientDetected !== "en" ? clientDetected : undefined);
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = clarifyAnswer.trim();
    const origLang = detectClientLanguage(originalQuery);
    const langToUse = origLang !== "en" ? origLang : selectedLanguage;
    if (!answer) {
      submit("SKIP", sessionFacts, clarificationRound, askedFacts, originalQuery, langToUse);
    } else {
      submit(answer, sessionFacts, clarificationRound, askedFacts, originalQuery, langToUse);
    }
  };

  const handleSkipClarify = () => {
    const origLang = detectClientLanguage(originalQuery);
    const langToUse = origLang !== "en" ? origLang : selectedLanguage;
    submit("SKIP", sessionFacts, clarificationRound, askedFacts, originalQuery, langToUse);
  };

  const handleSelectLanguage = async (langCode: string, queryRes?: QueryResult) => {
    if (langCode === selectedLanguage && !queryRes) return;

    const shouldAutoRenderLetter = hasTriggeredLetterPreview || generatedLetter !== null;

    if (langCode === "en") {
      setSelectedLanguage("en");
      if (shouldAutoRenderLetter) {
        handleGenerateLetter("en");
      }
      return;
    }

    if (translations[langCode]) {
      setSelectedLanguage(langCode);
      if (shouldAutoRenderLetter) {
        handleGenerateLetter(langCode);
      }
      return;
    }

    const targetResult = queryRes || result;
    if (!targetResult) return;

    setSelectedLanguage(langCode);
    setIsTranslating(true);
    setTranslationError(null);

    if (shouldAutoRenderLetter) {
      handleGenerateLetter(langCode);
    }

    try {
      const res = await fetch(`${API}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_language: langCode,
          answer: targetResult.answer,
          answerSimple: targetResult.answerSimple,
          evidence_reasons: targetResult.evidence?.reasons,
          pathway_authority: targetResult.pathway?.authority,
          pathway_deadline: targetResult.pathway?.deadlineNote,
          pathway_steps: targetResult.pathway?.steps?.map((s) => ({
            title: s.title,
            detail: s.detail,
            docs: s.docs || [],
          })),
          citations: targetResult.citations?.map((c) => ({
            act: c.act,
            section: c.section,
            jurisdiction: c.jurisdiction,
          })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const rawMsg = errJson?.detail || "Translation could not be completed at this time.";
        const displayMsg = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
        setTranslationError(displayMsg);
        setSelectedLanguage("en");
        setIsTranslating(false);
        return;
      }

      const data = await res.json();
      const mergedSteps = targetResult.pathway?.steps
        ? targetResult.pathway.steps.map((orig, i) => {
            const tr = data.pathway_steps?.[i];
            return {
              ...orig,
              title: tr?.title || orig.title,
              detail: tr?.detail || orig.detail,
              docs: tr?.docs && Array.isArray(tr.docs) && tr.docs.length > 0 ? tr.docs : orig.docs,
            };
          })
        : data.pathway_steps;

      setTranslations((prev) => ({
        ...prev,
        [langCode]: {
          answer: data.answer,
          answerSimple: data.answerSimple,
          evidence_reasons: data.evidence_reasons,
          pathway_authority: data.pathway_authority,
          pathway_deadline: data.pathway_deadline,
          pathway_steps: mergedSteps,
          citations: data.citations || targetResult.citations,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation could not be completed. Displaying English version.";
      setTranslationError(msg);
      setSelectedLanguage("en");
    } finally {
      setIsTranslating(false);
    }
  };

  const exportToPdf = () => {
    if (!result || typeof window === "undefined") return;

    const printDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const activeUser = (result.user_name || userName || "").trim();
    const jurisdictionLabel = (LOCALIZED_STATE_LABELS[selectedLanguage] || LOCALIZED_STATE_LABELS.en)[stateCode] || stateCode;
    const categoryLabel = (result.detectedCategory || "General Dispute")
      .replace(/_/g, " ")
      .toUpperCase();

    const activeTranslation = selectedLanguage !== "en" ? translations[selectedLanguage] : null;
    const currentAnswer = activeTranslation?.answer || result.answer;
    const currentAnswerSimple = activeTranslation?.answerSimple || result.answerSimple;
    const currentEvidenceReasons = activeTranslation?.evidence_reasons || result.evidence.reasons;
    const currentAuthority = activeTranslation?.pathway_authority || result.pathway?.authority;
    const currentDeadline = activeTranslation?.pathway_deadline || result.pathway?.deadlineNote;
    const currentSteps = (activeTranslation?.pathway_steps as PathwayStep[]) || result.pathway?.steps;

    const answerContent = simpleWording && currentAnswerSimple ? currentAnswerSimple : currentAnswer;
    const answerParagraphs = renderText(answerContent)
      .split("\n")
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p style="margin: 0 0 10px 0; line-height: 1.6; text-align: justify;">${p}</p>`)
      .join("");

    const secWord = SECTION_WORD[selectedLanguage] || "Section";
    const jurMap = JURISDICTION_WORD[selectedLanguage] || JURISDICTION_WORD.en;
    const citsToRender = (activeTranslation?.citations as Citation[]) || result.citations || [];
    const citationsHtml = citsToRender && citsToRender.length > 0
      ? citsToRender
          .map((c, i) => {
            const jurLabel = jurMap[c.jurisdiction?.toLowerCase()] || c.jurisdiction?.toUpperCase();
            return `
            <div style="padding: 8px 12px; border: 1px solid #d1d5db; margin-bottom: 6px; background-color: #fafafa; border-radius: 2px;">
              <div style="font-family: 'Times New Roman', serif; font-size: 13px; font-weight: bold; color: #111827;">
                §${(i + 1).toString().padStart(2, "0")}. ${renderText(c.act)}
              </div>
              <div style="font-family: monospace; font-size: 11px; color: #4b5563; margin-top: 2px;">
                ${secWord} ${renderText(c.section).replace(/^(?:Section|பிரிவு|धारा|ವಿಭಾಗ|कलम|విభాగం)\s*/i, "")} · ${renderText(jurLabel)}
              </div>
            </div>
          `;
          })
          .join("")
      : `<p style="font-style: italic; color: #6b7280; font-size: 12px;">No specific statutory sections cited.</p>`;

    const evidenceReasonsHtml = currentEvidenceReasons && currentEvidenceReasons.length > 0
      ? currentEvidenceReasons
          .map(r => `
            <li style="margin-bottom: 4px; line-height: 1.4;">
              <strong>✓</strong> ${renderText(r)}
            </li>
          `)
          .join("")
      : `<li>Standard statutory rules evaluated.</li>`;

    let pathwayHtml = "";
    if (result.pathway && result.hasDirectRecourse !== false && result.evidence?.level !== "Low") {
      const stepsHtml = (currentSteps || [])
        .map((s, i) => `
          <div style="margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #6b7280;">
            <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #111827; text-transform: uppercase;">
              STEP ${i + 1}: ${renderText(s.title)}
            </div>
            <div style="font-size: 11px; color: #374151; margin-top: 2px; line-height: 1.4;">
              ${renderText(s.detail)}
            </div>
          </div>
        `)
        .join("");

      pathwayHtml = `
        <div style="margin-top: 18px;">
          <div style="font-family: monospace; font-size: 10px; font-weight: bold; letter-spacing: 0.12em; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin-bottom: 8px;">
            05. NEXT STEPS & PROCEDURAL PATHWAY
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              <td style="width: 50%; padding: 6px 10px; border: 1px solid #d1d5db; background: #fafafa; vertical-align: top;">
                <div style="font-family: monospace; font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: bold;">AUTHORITY TO APPROACH</div>
                <div style="font-family: 'Times New Roman', serif; font-size: 12px; font-weight: bold; color: #111827; margin-top: 2px;">${renderText(currentAuthority)}</div>
              </td>
              <td style="width: 50%; padding: 6px 10px; border: 1px solid #d1d5db; background: #fafafa; vertical-align: top;">
                <div style="font-family: monospace; font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: bold;">STATUTORY LIMITATION</div>
                <div style="font-size: 11px; color: #1f2937; margin-top: 2px;">${renderText(currentDeadline)}</div>
              </td>
            </tr>
          </table>
          <div>
            ${stepsHtml}
          </div>
        </div>
      `;
    }

    let noticeLetterHtml = "";
    if (generatedLetter?.text) {
      noticeLetterHtml = `
        <div style="margin-top: 24px; page-break-before: always;">
          <div style="font-family: monospace; font-size: 10px; font-weight: bold; letter-spacing: 0.12em; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin-bottom: 10px;">
            ATTACHMENT: DRAFT FORMAL LEGAL NOTICE
          </div>
          <pre style="font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.45; white-space: pre-wrap; background: #fafafa; border: 1px solid #d1d5db; padding: 12px; color: #111827; margin: 0;">${generatedLetter.text}</pre>
        </div>
      `;
    }

    const printDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Legal Case Brief - KnowYourRights</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      margin: 0;
      padding: 0;
      color: #111827;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
    }
    .docket-header {
      border-bottom: 2px solid #111827;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .title {
      font-family: "Times New Roman", serif;
      font-size: 18px;
      font-weight: bold;
      color: #111827;
      letter-spacing: 0.03em;
      margin: 0 0 4px 0;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border: 1px solid #b91c1c;
      color: #b91c1c;
      font-family: monospace;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      margin-left: 8px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-family: monospace;
      font-size: 10px;
      margin-top: 6px;
    }
    .meta-table td {
      padding: 3px 0;
    }
    .section-title {
      font-family: monospace;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 0.12em;
      color: #4b5563;
      text-transform: uppercase;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    .reported-box {
      border-left: 3px solid #dc2626;
      padding: 6px 12px;
      background: #f9fafb;
      font-family: "Times New Roman", serif;
      font-style: italic;
      font-size: 13px;
      color: #1f2937;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .legal-answer {
      font-family: "Times New Roman", serif;
      font-size: 13px;
      color: #111827;
    }
    ul {
      margin: 0;
      padding-left: 14px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #d1d5db;
      font-family: monospace;
      font-size: 8.5px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="docket-header">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <div class="title">
        KNOWYOURRIGHTS · STATUTORY LEGAL CASE BRIEF
        <span class="badge">VERIFIED STATUTES</span>
      </div>
    </div>
    <table class="meta-table">
      <tr>
        <td style="width: 33%;"><strong>DATE:</strong> ${printDate}</td>
        <td style="width: 38%;"><strong>JURISDICTION:</strong> ${jurisdictionLabel} (${stateCode})</td>
        <td style="width: 29%;"><strong>EVIDENCE:</strong> ${result.evidence.level.toUpperCase()}</td>
      </tr>
      <tr>
        <td><strong>CATEGORY:</strong> ${categoryLabel}</td>
        <td colspan="2"><strong>CLIENT/NAME:</strong> ${activeUser || "Not Disclosed"}</td>
      </tr>
    </table>
  </div>

  <div class="section-title">01. REPORTED FACTS & USER STATEMENT</div>
  <div class="reported-box">
    &ldquo;${renderText(originalQuery)}&rdquo;
  </div>

  <div class="section-title">02. LEGAL POSITION & STATUTORY ASSESSMENT</div>
  <div class="legal-answer">
    ${answerParagraphs}
  </div>

  <div class="section-title">03. APPLICABLE STATUTORY PROVISIONS (${result.citations?.length || 0})</div>
  <div>
    ${citationsHtml}
  </div>

  <div class="section-title">04. EVIDENCE PRECONDITION ANALYSIS</div>
  <ul style="font-size: 11px; color: #1f2937;">
    ${evidenceReasonsHtml}
  </ul>

  ${pathwayHtml}

  ${noticeLetterHtml}

  <div class="footer">
    KnowYourRights (KYR) — AI Powered Grounded Legal Information System · Grounded in Indian Central & State Enactments · Confidential Legal Summary
  </div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printDocument);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 350);
    }
  };

  const handleGenerateLetter = async (targetLang?: string) => {
    if (!result) return;
    const langToUse = typeof targetLang === "string" ? targetLang : selectedLanguage;
    setHasTriggeredLetterPreview(true);

    if (letterTranslationsRef.current[langToUse]) {
      setGeneratedLetter(letterTranslationsRef.current[langToUse]);
      return;
    }

    setLetterError(null);
    setLetterLoading(true);
    try {
      const firstCitation = result.citations[0];
      const res = await fetch(`${API}/api/letter/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: result.detectedCategory || "unpaid_wages",
          act: firstCitation?.act || "Applicable Indian Statute",
          section: firstCitation?.section || "Statutory Section",
          authority: result.pathway?.authority || "District Legal Services Authority (DLSA)",
          ask_text: result.pathway?.steps[0]?.title || "resolve the outstanding claim",
          language: langToUse,
          fields: {
            employee_name: letterFields.employee_name.trim() || result.user_name || userName || undefined,
          },
        }),
      });
      if (!res.ok) {
        setLetterError("Could not render notice letter. Please verify details.");
        setLetterLoading(false);
        return;
      }
      const data: { text: string; html: string } = await res.json();
      letterTranslationsRef.current[langToUse] = data;
      setGeneratedLetter(data);
    } catch {
      setLetterError("Failed to connect to backend server for notice letter rendering.");
    } finally {
      setLetterLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!result) return;
    try {
      const firstCitation = result.citations[0];
      const res = await fetch(`${API}/api/letter/docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: result.detectedCategory || "unpaid_wages",
          act: firstCitation?.act || "Applicable Indian Statute",
          section: firstCitation?.section || "Statutory Section",
          authority: result.pathway?.authority || "District Legal Services Authority (DLSA)",
          ask_text: result.pathway?.steps[0]?.title || "resolve the outstanding claim",
          language: selectedLanguage,
          fields: {
            employee_name: letterFields.employee_name.trim() || result.user_name || userName || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to download docx");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const langSuffix = selectedLanguage !== "en" ? `_${selectedLanguage.toUpperCase()}` : "";
      a.download = `Legal_Notice_${(result?.detectedCategory || "claim").toUpperCase()}${langSuffix}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setLetterError("Failed to download .docx notice letter file.");
    }
  };

  const activeTranslation = result && selectedLanguage !== "en" ? translations[selectedLanguage] : null;
  const displayAnswer = activeTranslation?.answer || result?.answer || "";
  const displayAnswerSimple = activeTranslation?.answerSimple || result?.answerSimple || "";
  const displayEvidenceReasons = activeTranslation?.evidence_reasons || result?.evidence?.reasons || [];
  const displayAuthority = activeTranslation?.pathway_authority || result?.pathway?.authority || "";
  const displayDeadline = activeTranslation?.pathway_deadline || result?.pathway?.deadlineNote || "";
  const displaySteps = (activeTranslation?.pathway_steps as PathwayStep[]) || result?.pathway?.steps || [];
  const displayCitations = (activeTranslation?.citations as Citation[]) || result?.citations || [];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] font-sans antialiased py-8 px-4 sm:px-8 md:px-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Full-width Editorial Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border)] font-sans no-print">
          <div onClick={handleLogoClick} className="cursor-pointer flex items-center gap-3 select-none">
            <span className="text-xl sm:text-2xl">⚖</span>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl tracking-wider uppercase text-[var(--text-1)] block leading-none">
                KNOWYOURRIGHTS
              </span>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[var(--text-3)] uppercase block mt-1">
                {currentUi.nav.tagline}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono flex-wrap justify-end">
            {/* Global language dropdown — hidden entirely during clarification loop */}
            {appState !== "CLARIFICATION" && (
              <div className="flex items-center gap-2">
                <LanguageDropdown
                  selectedLanguage={selectedLanguage}
                  isTranslating={isTranslating}
                  onSelectLanguage={(newLang) => {
                    if (appState === "RESULT") {
                      handleSelectLanguage(newLang);
                    } else {
                      setSelectedLanguage(newLang);
                    }
                  }}
                  languages={LANGUAGES}
                />
                {isTranslating && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 border border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] font-mono tracking-widest uppercase rounded-none select-none animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-400 animate-ping" />
                    <span className="font-bold hidden sm:inline">Translating...</span>
                  </div>
                )}
              </div>
            )}
            {appState === "HOME" ? (
              <>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(true)}
                  className="px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-1)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs font-mono rounded-none uppercase transition-colors cursor-pointer select-none flex items-center gap-1.5"
                >
                  <span>{(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).history}</span>
                  <span className="text-[10px] text-[var(--text-3)] font-bold">[{history.length}]</span>
                </button>
                <a
                  href="#how-it-works"
                  className="px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-1)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs font-mono rounded-none uppercase transition-colors cursor-pointer select-none hidden sm:inline-block"
                >
                  {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).howItWorks}
                </a>
                <button
                  type="button"
                  onClick={handleHeaderNewQuery}
                  className="px-3.5 py-1.5 border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 rounded-none transition-opacity cursor-pointer select-none"
                >
                  {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).newQuery}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setHowModalOpen(true)}
                  className="px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-1)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs font-mono rounded-none uppercase transition-colors cursor-pointer select-none hidden sm:inline-block"
                >
                  {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).howItWorks}
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(true)}
                  className="px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-1)] hover:bg-[var(--bg-subtle)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs font-mono rounded-none uppercase transition-colors cursor-pointer select-none flex items-center gap-1.5"
                >
                  <span>{(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).history}</span>
                  <span className="text-[10px] text-[var(--text-3)] font-bold">[{history.length}]</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewQuestion}
                  className="px-3.5 py-1.5 border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 rounded-none transition-opacity cursor-pointer select-none"
                >
                  {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).newQuery}
                </button>
              </>
            )}
          </div>
        </header>

        <HowItWorksModal open={howModalOpen} onClose={() => setHowModalOpen(false)} lang={selectedLanguage} />
        <HistoryModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          history={history}
          onSelectHistory={handleSelectHistoryItem}
          onClearHistory={handleClearHistory}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          lang={selectedLanguage}
        />

        {appState === "HOME" && (
          <Homepage
            userName={userName}
            setUserName={setUserName}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            onStartQuery={handleStartFromHomepage}
            onOpenHowModal={() => setHowModalOpen(true)}
            lang={selectedLanguage}
          />
        )}

        {appState === "EMPTY" && (
          <main className="py-8 sm:py-10 animate-fade-up">
            {/* Session Context Bar */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6 font-mono text-xs text-[var(--text-3)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent-crimson)] font-bold">● {currentUi.workspace.statusKicker}</span>
                <span>·</span>
                <span>
                  {currentUi.workspace.applicantLabel} {userName.trim() ? userName.trim().toUpperCase() : "ANONYMOUS"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[var(--text-2)]">{currentUi.workspace.termsAcknowledged}</span>
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="text-[var(--text-3)] hover:text-[var(--text-1)] underline cursor-pointer"
                >
                  {currentUi.workspace.backToOverview}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase">
                  {currentUi.workspace.kicker}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[var(--text-1)] leading-tight">
                {currentUi.workspace.title}
              </h1>
              <p className="text-2xl sm:text-3xl font-serif text-[var(--text-2)] italic mt-1">
                {currentUi.workspace.subtitle}
              </p>
            </div>

            <form onSubmit={handleFirstSubmit} className="space-y-8">

              {/* Jurisdiction Selector */}
              <div>
                <label className="block text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-3">
                  {currentUi.workspace.jurisdictionLabel}
                </label>
                <div className="flex flex-wrap gap-2 font-mono text-xs font-bold uppercase">
                  {(Object.entries(LOCALIZED_STATE_LABELS[selectedLanguage] || LOCALIZED_STATE_LABELS.en) as [StateCode, string][]).map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setStateCode(code)}
                      className={`px-5 py-2.5 border transition-all rounded-none ${
                        stateCode === code
                          ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] shadow-sm"
                          : "bg-[var(--bg-surface)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--text-1)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase">
                    {currentUi.workspace.inputLabel}
                  </label>
                  <span className={`text-xs font-mono ${charCount > 800 ? "text-[var(--accent-crimson)]" : "text-[var(--text-3)]"}`}>
                    {charCount} / 1000
                  </span>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-5 focus-within:border-[var(--text-1)] transition-colors rounded-none">
                  <textarea
                    value={query}
                    onChange={e => { setQuery(e.target.value); setCharCount(e.target.value.length); }}
                    placeholder={currentUi.workspace.inputPlaceholder}
                    rows={7}
                    maxLength={1000}
                    className="w-full bg-transparent text-[var(--text-1)] text-base sm:text-lg placeholder:text-[var(--text-4)] focus:outline-none resize-y leading-relaxed font-sans"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-[var(--bg-subtle)] border-l-2 border-[var(--accent-crimson)] text-[var(--accent-crimson)] text-xs font-mono rounded-none">
                  [ERROR] {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
              )}

              <hr className="border-t border-[var(--border)] my-6" />

              {/* Submit action button */}
              <button
                type="submit"
                suppressHydrationWarning
                disabled={query.trim().length < 5}
                className={`w-full py-4 text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase transition-all border rounded-none ${
                  query.trim().length >= 5
                    ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] hover:opacity-90 cursor-pointer shadow-sm"
                    : "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
                }`}
              >
                {currentUi.workspace.analyzeBtn}
              </button>
            </form>

            {/* Bottom Metadata */}
            <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-between font-mono text-xs text-[var(--text-3)] flex-wrap gap-4">
              <div>
                <span className="block font-bold text-[var(--text-2)] tracking-wider uppercase mb-0.5">{currentUi.workspace.jurisdictionsCovered}</span>
                <span>TAMIL NADU · MAHARASHTRA · KARNATAKA</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[var(--text-2)] tracking-wider uppercase">{currentUi.workspace.verifiedSources}</span>
              </div>
            </div>

            {/* Start with an example section */}
            <div className="mt-12">
              <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                {currentUi.workspace.exampleHeader}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                {activeExamples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(ex.text); setCharCount(ex.text.length); }}
                    className="p-4 border border-[var(--border)] bg-[var(--bg-surface)] text-left interactive-paper flex flex-col justify-between group cursor-pointer rounded-none"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
                        <span className="text-[var(--accent-crimson)] font-bold">{ex.ref}</span>
                        <span className="text-[var(--text-3)] group-hover:text-[var(--text-1)] font-bold">{currentUi.workspace.useThis}</span>
                      </div>
                      <p className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wide mb-1">{ex.label}</p>
                      <p className="text-xs text-[var(--text-2)] line-clamp-2 leading-relaxed">&ldquo;{ex.text}&rdquo;</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        )}

        {appState === "LOADING" && (
          <main className="py-16 flex items-center justify-center">
            <LoadingChecklist step={loadingStep} lang={selectedLanguage} />
          </main>
        )}

        {appState === "CLARIFICATION" && (
          <main className="py-8 animate-fade-up max-w-2xl mx-auto font-sans">
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-10 shadow-sm rounded-none">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6 font-mono text-xs text-[var(--text-3)] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-1)]">{currentUi.clarification.header}</span>
                  <span>·</span>
                  <span>FACT INTAKE {clarifyTurn} OF {MAX_TURNS}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="legal-stamp">{currentUi.clarification.stamp}</span>
                </div>
                <p className="text-xs text-[var(--text-2)] font-serif italic mb-4">
                  {currentUi.clarification.intro}
                </p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-1)] leading-snug">{renderText(clarifyQ)}</h2>
                {clarifyReason && <p className="text-xs text-[var(--text-2)] mt-2">{renderText(clarifyReason)}</p>}
              </div>

              <form onSubmit={handleClarifySubmit} className="space-y-4">
                <textarea
                  value={clarifyAnswer}
                  onChange={e => setClarifyAnswer(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full p-4 border border-[var(--border)] bg-[var(--bg-subtle)] text-base text-[var(--text-1)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--text-1)] font-sans rounded-none"
                />
                <div className="flex gap-3 font-mono text-xs font-bold uppercase">
                  <button
                    type="submit"
                    disabled={!clarifyAnswer.trim()}
                    className={`flex-1 py-3.5 border transition-all rounded-none ${
                      clarifyAnswer.trim()
                        ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] cursor-pointer"
                        : "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
                    }`}
                  >
                    {currentUi.clarification.continueBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipClarify}
                    className="px-5 py-3.5 text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--border)] cursor-pointer rounded-none"
                  >
                    {currentUi.clarification.skipBtn}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-4 border-t border-[var(--border)]">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-3)] mb-1">ORIGINAL STATEMENT</p>
                <p className="text-xs text-[var(--text-2)] italic">&ldquo;{originalQuery}&rdquo;</p>
              </div>
            </div>
          </main>
        )}

        {appState === "RESULT" && result && (
          <main ref={resultRef} className="py-8 animate-fade-up">
            {/* Digital Case File Container */}
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-12 shadow-sm">
              {/* Top Legal Docket Header */}
              {(() => {
                const sh = SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en;
                return (
                  <div className="flex items-center justify-between border-b-2 border-[var(--text-1)] pb-4 mb-8 font-mono text-xs flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base tracking-wider text-[var(--text-1)]">
                        {sh.caseSheet}
                      </span>
                      <span className="legal-stamp">{sh.verifiedBadge}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[var(--text-2)] font-bold">
                      <span>{((LOCALIZED_STATE_LABELS[selectedLanguage] || LOCALIZED_STATE_LABELS.en)[stateCode] || stateCode).toUpperCase()}</span>
                      <span>·</span>
                      <span>{sh.confidence}: {result.evidence.level.toUpperCase()}</span>
                      <button
                        onClick={exportToPdf}
                        className="px-2.5 py-1 border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--text-1)] text-[var(--text-1)] transition-colors text-[10px] no-print cursor-pointer"
                        title="Export legal brief as PDF document"
                      >
                        [ {sh.exportPdf} ]
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Translation loading banner */}
              {isTranslating && (
                <div className="mb-6 p-4 border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs flex items-center justify-between gap-4 animate-fade-up no-print">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div>
                      <span className="font-bold uppercase tracking-wider block">Translating Case Sheet...</span>
                      <span className="text-[11px] text-[var(--text-2)] font-sans">
                        Converting statutory analysis, applicable legal provisions, and procedural pathway into {LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage}.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-2)] hidden sm:inline-block">
                    PROCESSING
                  </span>
                </div>
              )}

              {/* Translation error notice (shown inline when translation fails) */}
              {translationError && (
                <div className="mb-4 p-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--accent-crimson)] text-[10px] font-mono no-print">
                  {translationError}
                </div>
              )}

              <div className={`transition-opacity duration-300 ${isTranslating ? "opacity-30 pointer-events-none select-none" : "opacity-100"}`}>
              {/* Reported facts */}
              <div className="mb-8">
                <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-2">
                  {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).reportedFacts}
                </p>
                <p className="text-xl font-serif italic text-[var(--text-1)] paper-rule-margin leading-relaxed">
                  &ldquo;{renderText(originalQuery)}&rdquo;
                </p>
              </div>

              <hr className="border-t border-[var(--border)] my-8" />

              {/* Legal Position & Assessment */}
              <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase">
                    {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).legalPosition}
                  </p>
                  <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] p-1 border border-[var(--border)] no-print text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleToggleSimple(false)}
                      className={`px-2.5 py-1 transition-colors cursor-pointer ${
                        !simpleWording
                          ? "bg-[var(--text-1)] text-[var(--bg)] font-bold shadow-xs"
                          : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                      }`}
                    >
                      {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).detailedMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSimple(true)}
                      className={`px-2.5 py-1 transition-colors cursor-pointer ${
                        simpleWording
                          ? "bg-[var(--text-1)] text-[var(--bg)] font-bold shadow-xs"
                          : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                      }`}
                    >
                      {(SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en).simpleMode}
                    </button>
                  </div>
                </div>
                <div className="font-serif text-lg sm:text-xl text-[var(--text-1)] leading-relaxed space-y-4">
                  {renderText(simpleWording && displayAnswerSimple ? displayAnswerSimple : displayAnswer)
                    .split("\n")
                    .map((para, i) => (para.trim() ? <p key={i}>{para}</p> : null))}
                </div>
              </div>

              <hr className="border-t border-[var(--border)] my-8" />

              {/* Grid section for Statutory Provisions & Evidence */}
              {(() => {
                const sectionHeaders = SECTION_HEADERS[selectedLanguage] || SECTION_HEADERS.en;
                const noticeUi = NOTICE_UI[selectedLanguage] || NOTICE_UI.en;
                return (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      {/* Applicable Provisions */}
                      {displayCitations.length > 0 && (
                        <div>
                          <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                            {sectionHeaders.provisions} ({displayCitations.length})
                          </p>
                          <div className="space-y-3 font-sans">
                            {displayCitations.map((c, i) => {
                              const secWord = SECTION_WORD[selectedLanguage] || "Section";
                              const jurMap = JURISDICTION_WORD[selectedLanguage] || JURISDICTION_WORD.en;
                              const jurLabel = jurMap[c.jurisdiction?.toLowerCase()] || c.jurisdiction?.toUpperCase();
                              return (
                                <div key={i} className="p-4 border border-[var(--border)] bg-[var(--bg-subtle)] flex items-start gap-4 interactive-paper">
                                  <span className="font-mono font-bold text-sm text-[var(--accent-crimson)]">
                                    §{(i + 1).toString().padStart(2, "0")}
                                  </span>
                                  <div>
                                    <p className="text-base font-serif font-bold text-[var(--text-1)]">{renderText(c.act)}</p>
                                    {(() => {
                                      const rawSec = renderText(c.section);
                                      const cleanSec = rawSec.replace(/^(?:Section|பிரிவு|धारा|ವಿಭಾಗ|कलम|విభాగం)\s*/i, "");
                                      return (
                                        <p className="text-xs font-mono text-[var(--text-2)] mt-1">{secWord} {cleanSec} · {renderText(jurLabel)}</p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Precondition verification */}
                      <div>
                        <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                          {sectionHeaders.evidence}
                        </p>
                        <div className="p-4 border border-[var(--border)] font-sans space-y-2.5">
                          {displayEvidenceReasons.map((r, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[var(--text-1)] leading-relaxed">
                              <span className="font-mono text-[var(--accent-crimson)] font-bold">✓</span>
                              <span>{renderText(r)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Procedural Pathway */}
                    {result.pathway && result.hasDirectRecourse !== false && result.evidence?.level !== "Low" && (
                      <div className="mb-8">
                        <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                          {sectionHeaders.pathway}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 font-sans">
                          <div className="p-4 border border-[var(--border)] bg-[var(--bg-subtle)]">
                            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-1">
                              {sectionHeaders.authority}
                            </p>
                            <p className="text-base font-serif font-bold text-[var(--text-1)]">{renderText(displayAuthority)}</p>
                          </div>
                          <div className="p-4 border border-[var(--border)]">
                            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-1">
                              {sectionHeaders.deadline}
                            </p>
                            <p className="text-xs text-[var(--text-1)] leading-relaxed">{renderText(displayDeadline)}</p>
                          </div>
                        </div>

                        <div className="border border-[var(--border)] p-4 sm:p-6 font-sans">
                          <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-3">
                            {sectionHeaders.actionSteps}
                          </p>
                          {(displaySteps || []).map((s, i) => (
                            <PathwayStepRow
                              key={i}
                              step={s}
                              i={i}
                              total={(displaySteps || []).length}
                              language={selectedLanguage}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Notice Letter Generator Section — Only rendered when letterEligible is true */}
                    {result.letterEligible && (
                      <div className="mt-8 border border-[var(--border)] bg-[var(--bg-subtle)] p-6 no-print">
                        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border)] pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[var(--accent-crimson)]">
                                {noticeUi.badge}
                              </span>
                            </div>
                            <h4 className="text-lg font-serif font-bold text-[var(--text-1)] mt-1">
                              {noticeUi.heading}
                            </h4>
                            <p className="text-xs text-[var(--text-2)] font-sans mt-0.5">
                              {noticeUi.desc}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!showLetterForm && !letterFields.employee_name && (result.user_name || userName)) {
                                setLetterFields(f => ({ ...f, employee_name: result.user_name || userName }));
                              }
                              setShowLetterForm(s => !s);
                            }}
                            className="px-4 py-2 border border-[var(--border-strong)] bg-[var(--text-1)] text-[var(--bg)] font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            {showLetterForm ? noticeUi.hideForm : noticeUi.createBtn}
                          </button>
                        </div>

                        {showLetterForm && (
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1.5 font-mono">
                                {noticeUi.nameLabel}
                              </label>
                              <input
                                type="text"
                                value={letterFields.employee_name}
                                onChange={e => {
                                  setLetterFields({ employee_name: e.target.value });
                                  letterTranslationsRef.current = {};
                                }}
                                className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] text-sm sm:text-base focus:outline-none focus:border-[var(--text-1)] font-sans transition-colors"
                              />
                              <p className="text-[11px] text-[var(--text-3)] mt-1.5 font-sans">
                                {noticeUi.nameSub}
                              </p>
                            </div>

                            {letterError && (
                              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--accent-crimson)] text-[var(--accent-crimson)] text-xs font-mono">
                                [ERROR] {letterError}
                              </div>
                            )}

                            <div className="flex gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => handleGenerateLetter()}
                                disabled={letterLoading}
                                className="px-5 py-2.5 bg-[var(--text-1)] text-[var(--bg)] font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                              >
                                {letterLoading ? noticeUi.generating : noticeUi.previewBtn}
                              </button>
                            </div>

                            {/* Rendered Letter Preview & .DOCX Download */}
                            {generatedLetter && (
                              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] flex items-center gap-2">
                                    <span>{noticeUi.previewHeading}</span>
                                    {letterLoading && (
                                      <span className="inline-block animate-pulse text-[var(--accent-crimson)] font-bold">●</span>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleDownloadDocx}
                                    disabled={letterLoading}
                                    className="px-4 py-2 border border-[var(--border-strong)] bg-[var(--text-1)] text-[var(--bg)] text-xs font-mono font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                                  >
                                    <span>⬇</span> {noticeUi.downloadBtn}
                                  </button>
                                </div>
                                <pre className={`p-5 bg-[var(--bg-surface)] border border-[var(--border)] text-xs sm:text-sm font-mono text-[var(--text-1)] whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto transition-opacity ${letterLoading ? "opacity-50" : "opacity-100"}`}>
                                  {generatedLetter.text}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
              </div>
            </div>

            <DebugPanel data={result.ragDebug} />
          </main>
        )}
      </div>
    </div>
  );
}