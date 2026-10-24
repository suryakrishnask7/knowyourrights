"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Homepage from "./components/Homepage";

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
};

const STATE_LABELS: Record<StateCode, string> = { TN: "Tamil Nadu", MH: "Maharashtra", KA: "Karnataka" };

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
  ta: "தேவையான சட்ட ஆவணங்கள் (STATUTORY RECORDS)",
  hi: "आवश्यक वैधानिक दस्तावेज (STATUTORY RECORDS)",
  kn: "ಅಗತ್ಯವಿರುವ ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳು (STATUTORY RECORDS)",
  mr: "आवश्यक वैधानिक कागदपत्रे (STATUTORY RECORDS)",
  te: "అవసరమైన చట్టబద్ధమైన రಿಕార్డులు (STATUTORY RECORDS)",
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
    badge: "§ அதிகாரப்பூர்வ சட்ட அறிவிப்பு வரைவு (FORMAL NOTICE DRAFT)",
    heading: "உடனடியாக அனுப்பக்கூடிய சட்ட அறிவிப்பு கடிதம் வேண்டுமா?",
    desc: "சரிபார்க்கப்பட்ட சட்டப் பிரிவுகளைக் குறிப்பிட்டு அதிகாரப்பூர்வ சட்ட அறிவிப்பை உருவாக்கவும். உங்கள் விவரங்கள் உள்ளூரிலேயே செயலாக்கப்படும்.",
    nameLabel: "உங்கள் முழுமையான சட்டப்பூர்வ பெயர் (YOUR FULL LEGAL NAME)",
    nameSub: "கடிதத்தில் உள்ள பிற அனைத்து புலங்களும் (பெறுநர், முகவரிகள், கோரிக்கை தொகைகள்) நீங்கள் மதிப்பாய்வு செய்ய நிலையான அடைப்புக்குறி ஒதுக்கிடங்களுடன் நிரப்பப்படும்.",
    previewBtn: "அறிவிப்பு கடிதத்தை பார்க்கவும் (PREVIEW NOTICE LETTER)",
    previewHeading: "சட்ட அறிவிப்பு கடித முன்னோட்டம் (NOTICE LETTER PREVIEW)",
    downloadBtn: "சட்ட அறிவிப்பை பதிவிறக்கவும் (.DOCX)",
    hideForm: "படிவத்தை மறைக்கவும் [-]",
    createBtn: "+ சட்ட அறிவிப்பு கடிதம் உருவாக்கவும்",
    generating: "உருவாக்குகிறது..."
  },
  hi: {
    badge: "§ औपचारिक कानूनी नोटिस प्रारूप (FORMAL NOTICE DRAFT)",
    heading: "क्या आप तैयार कानूनी नोटिस पत्र चाहते हैं?",
    desc: "सत्यापित कानूनों का हवाला देते हुए एक आधिकारिक कानूनी नोटिस तैयार करें। व्यक्तिगत विवरण स्थानीय रूप से संसाधित होते हैं।",
    nameLabel: "आपका पूरा कानूनी नाम (YOUR FULL LEGAL NAME)",
    nameSub: "पत्र के अन्य सभी क्षेत्र मानक कोष्ठक प्लेसहोल्डर्स के साथ भरे जाते हैं ताकि आप उनकी समीक्षा कर सकें।",
    previewBtn: "नोटिस पत्र पूर्वावलोकन देखें (PREVIEW NOTICE LETTER)",
    previewHeading: "कानूनी नोटिस पत्र पूर्वावलोकन (NOTICE LETTER PREVIEW)",
    downloadBtn: "नोटिस पत्र डाउनलोड करें (.DOCX)",
    hideForm: "फॉर्म छुपाएं [-]",
    createBtn: "+ कानूनी नोटिस पत्र बनाएं",
    generating: "तैयार हो रहा है..."
  },
  kn: {
    badge: "§ ಅಧಿಕೃತ ಕಾನೂನು ನೋಟಿಸ್ ಕರಡು (FORMAL NOTICE DRAFT)",
    heading: "ಕಳುಹಿಸಲು ಸಿದ್ಧವಾಗಿರುವ ನೋಟಿಸ್ ಪತ್ರ ಬೇಕೇ?",
    desc: "ಪರಿಶೀಲಿಸಿದ ಕಾನೂನುಗಳನ್ನು ಉಲ್ಲೇಖಿಸಿ ಅಧಿಕೃತ ಕಾನೂನು ನೋಟಿಸ್ ರಚಿಸಿ. ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಸಂಸ್ಕರಿಸಲಾಗುತ್ತದೆ.",
    nameLabel: "ನಿಮ್ಮ ಪೂರ್ಣ ಕಾನೂನು ಹೆಸರು (YOUR FULL LEGAL NAME)",
    nameSub: "ಪತ್ರದಲ್ಲಿನ ಎಲ್ಲಾ ಇತರ ಕ್ಷೇತ್ರಗಳನ್ನು ನೀವು ಪರಿಶೀಲಿಸಲು ಮಾನದಂಡದ ಬ್ರಾಕೆಟ್ ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್‌ಗಳೊಂದಿಗೆ ಭರ್ತಿ ಮಾಡಲಾಗುತ್ತದೆ.",
    previewBtn: "ನೋಟಿಸ್ ಪತ್ರ ಮುನ್ನೋಟ ವೀಕ್ಷಿಸಿ (PREVIEW NOTICE LETTER)",
    previewHeading: "ಕಾನೂನು ನೋಟಿಸ್ ಪತ್ರ ಮುನ್ನೋಟ (NOTICE LETTER PREVIEW)",
    downloadBtn: "ನೋಟಿಸ್ ಪತ್ರ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.DOCX)",
    hideForm: "ಫಾರ್ಮ್ ಮರೆಮಾಡಿ [-]",
    createBtn: "+ ಕಾನೂನು ನೋಟಿಸ್ ಪತ್ರ ರಚಿಸಿ",
    generating: "ರಚಿಸಲಾಗುತ್ತಿದೆ..."
  },
  mr: {
    badge: "§ औपचारिक कायदेशीर नोटीस मसुदा (FORMAL NOTICE DRAFT)",
    heading: "पाठवण्यासाठी तयार कायदेशीर नोटीस हवी आहे का?",
    desc: "पडताळणी केलेल्या कायद्यांचा संदर्भ देऊन अधिकृत कायदेशीर नोटीस तयार करा. वैयक्तिक तपशील स्थानिक पातळीवर प्रक्रिया केले जातात.",
    nameLabel: "आपले पूर्ण कायदेशीर नाव (YOUR FULL LEGAL NAME)",
    nameSub: "पत्रातील इतर सर्व माहिती आपण पुनरावलोकन करण्यासाठी मानक कंसामध्ये भरली जाते.",
    previewBtn: "नोटीस पत्राचे पूर्वावलोकन पहा (PREVIEW NOTICE LETTER)",
    previewHeading: "कायदेशीर नोटीस पूर्वावलोकन (NOTICE LETTER PREVIEW)",
    downloadBtn: "नोटीस पत्र डाउनलोड करा (.DOCX)",
    hideForm: "फॉर्म लपवा [-]",
    createBtn: "+ कायदेशीर नोटीस पत्र तयार करा",
    generating: "तयार होत आहे..."
  },
  te: {
    badge: "§ అధికారిక చట్టపరమైన నోటీసు చిత్తుప్రతి (FORMAL NOTICE DRAFT)",
    heading: "పంపడానికి సిద్ధంగా ఉన్న నోటీసు లేఖ కావాలా?",
    desc: "ధృవీకరించబడిన చట్టాలను ప్రస్తావిస్తూ అధికారిక చట్టపరమైన నోటీసును రూపొందించండి. వ్యక్తిగత వివరాలు స్థానికంగా ప్రాసెస్ చేయబడతాయి.",
    nameLabel: "మీ పూర్తి చట్టపరమైన పేరు (YOUR FULL LEGAL NAME)",
    nameSub: "లేఖలోని ఇతర అన్ని వివరాలు మీరు సమీక్షించడానికి ప్రామాణిక బ్రాకెట్ ప్లేస్‌హోల్డర్‌లతో నింపబడతాయి.",
    previewBtn: "నోటీసు లేఖ ముందస్తు వీక్షణ (PREVIEW NOTICE LETTER)",
    previewHeading: "చట్టపరమైన నోటీసు లేఖ ముందస్తు వీక్షణ (NOTICE LETTER PREVIEW)",
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
}> = {
  en: {
    provisions: "APPLICABLE STATUTORY PROVISIONS",
    evidence: "EVIDENCE PRECONDITION ANALYSIS",
    pathway: "NEXT STEPS & PROCEDURAL PATHWAY",
    authority: "AUTHORITY TO APPROACH",
    deadline: "STATUTORY DEADLINE",
    actionSteps: "ACTION STEPS",
  },
  ta: {
    provisions: "பொருந்தக்கூடிய சட்ட விதிகள் (STATUTORY PROVISIONS)",
    evidence: "சான்றுகள் மற்றும் நிபந்தனைகள் பகுப்பாய்வு (EVIDENCE ANALYSIS)",
    pathway: "அடுத்த கட்ட சட்ட நடைமுறைகள் (PROCEDURAL PATHWAY)",
    authority: "அணுக வேண்டிய சட்ட அதிகாரம் (AUTHORITY TO APPROACH)",
    deadline: "சட்டரீதியான காலக்கெடு (STATUTORY DEADLINE)",
    actionSteps: "செயல்பாட்டு படிகள் (ACTION STEPS)",
  },
  hi: {
    provisions: "लागू होने वाले वैधानिक प्रावधान (STATUTORY PROVISIONS)",
    evidence: "साक्ष्य एवं पूर्वशर्त विश्लेषण (EVIDENCE ANALYSIS)",
    pathway: "अगले कदम एवं प्रक्रियात्मक मार्ग (PROCEDURAL PATHWAY)",
    authority: "संपर्क करने योग्य कानूनी प्राधिकरण (AUTHORITY TO APPROACH)",
    deadline: "वैधानिक समय सीमा (STATUTORY DEADLINE)",
    actionSteps: "कार्रवाई के कदम (ACTION STEPS)",
  },
  kn: {
    provisions: "ಅನ್ವಯವಾಗುವ ಶಾಸನಬದ್ಧ ನಿಬಂಧನೆಗಳು (STATUTORY PROVISIONS)",
    evidence: "ಪುರಾವೆ ಪೂರ್ವಾಪೇಕ್ಷಿತ ವಿಶ್ಲೇಷಣೆ (EVIDENCE ANALYSIS)",
    pathway: "ಮುಂದಿನ ಹಂತಗಳು ಮತ್ತು ಕಾರ್ಯವಿಧಾನದ ಮಾರ್ಗ (PROCEDURAL PATHWAY)",
    authority: "ಸಂಪರ್ಕಿಸಬೇಕಾದ ಪ್ರಾಧಿಕಾರ (AUTHORITY TO APPROACH)",
    deadline: "ಶಾಸನಬದ್ಧ ಗಡುವು (STATUTORY DEADLINE)",
    actionSteps: "ಕ್ರಮದ ಹಂತಗಳು (ACTION STEPS)",
  },
  mr: {
    provisions: "लागू कायदेशीर तरतुदी (STATUTORY PROVISIONS)",
    evidence: "पुरावा पूर्वअट विश्लेषण (EVIDENCE ANALYSIS)",
    pathway: "पुढील पावले आणि प्रक्रियात्मक मार्ग (PROCEDURAL PATHWAY)",
    authority: "संपर्क साधण्याचे प्राधिकरण (AUTHORITY TO APPROACH)",
    deadline: "कायदेशीर अंतिम मुदत (STATUTORY DEADLINE)",
    actionSteps: "कृतीची पावले (ACTION STEPS)",
  },
  te: {
    provisions: "వర్తించే చట్టబద్ధమైన నిబంధనలు (STATUTORY PROVISIONS)",
    evidence: "సాక్ష్యాల పూర్వపరిస్థితి విశ్లేషణ (EVIDENCE ANALYSIS)",
    pathway: "తదుపరి దశలు & విధానపరమైన మార్గం (PROCEDURAL PATHWAY)",
    authority: "సంప్రదించాల్సిన అధికారం (AUTHORITY TO APPROACH)",
    deadline: "చట్టబద్ధమైన గడువు (STATUTORY DEADLINE)",
    actionSteps: "చర్య దశలు (ACTION STEPS)",
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
  { ref: "EXAMPLE 01", label: "UNPAID WAGES", text: "My employer hasn't paid my salary for two months." },
  { ref: "EXAMPLE 02", label: "PF NON-DEPOSIT", text: "PF was deducted but not credited to my EPFO account." },
  { ref: "EXAMPLE 03", label: "WRONGFUL TERMINATION", text: "I was terminated immediately without notice or severance pay." },
  { ref: "EXAMPLE 04", label: "TENANCY DEPOSIT REFUND", text: "My landlord is refusing to refund my security deposit after I vacated." },
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

function HowItWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-6 relative animate-fade-up shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-3)] hover:text-[var(--text-1)] text-xs font-mono">✕ CLOSE</button>
        <div className="border-b border-[var(--border)] pb-3 mb-4">
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[var(--text-3)] mb-0.5">SYSTEM ARCHITECTURE</p>
          <h3 className="text-xl font-serif font-bold text-[var(--text-1)]">How KnowYourRights Works</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
          {[
            { num: "01", title: "TELL US WHAT HAPPENED", desc: "Describe your situation in your own words. We identify the important details, such as what happened, when it happened, and what you are claiming." },
            { num: "02", title: "UNDERSTAND YOUR LEGAL ISSUE", desc: "We identify what kind of legal problem you're facing and determine which areas of law may apply." },
            { num: "03", title: "FIND THE RELEVANT LAW", desc: "We search Indian laws and relevant state-specific provisions to find the rules that apply to your situation." },
            { num: "04", title: "CHECK WHETHER THE LAW FITS", desc: "We check the legal requirements against the facts you provided to see whether there is enough evidence to support an answer." },
            { num: "05", title: "BUILD YOUR CASE SUMMARY", desc: "We bring the relevant laws, sections, evidence, and practical next steps together into a clear legal information summary." },
          ].map((item, idx) => (
            <div key={item.num} className={`p-3.5 border border-[var(--border)] bg-[var(--bg-subtle)] ${idx === 4 ? "sm:col-span-2" : ""}`}>
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

function LoadingChecklist({ step }: { step: number }) {
  return (
    <div className="w-full max-w-md mx-auto py-10 px-8 border border-[var(--border)] bg-[var(--bg-surface)] animate-fade-up shadow-sm">
      <div className="border-b border-[var(--border)] pb-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase">
            STATUTORY ENGINE ACTIVE
          </p>
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--text-1)] mt-1">
          Analyzing Legal Situation
        </h3>
      </div>
      <div className="space-y-4 font-sans">
        {PIPELINE_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center gap-3.5">
              <div className={`w-6 h-6 flex items-center justify-center text-xs font-mono font-bold border transition-all ${
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
  const resultRef = useRef<HTMLDivElement>(null);

  // Notice letter state
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [letterFields, setLetterFields] = useState({
    employee_name: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<{ text: string; html: string } | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);

  // Translation state (supports English + 5 Indic languages)
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translations, setTranslations] = useState<Record<string, {
    answer: string;
    answerSimple?: string;
    evidence_reasons?: string[];
    pathway_authority?: string;
    pathway_deadline?: string;
    pathway_steps?: PathwayStep[];
  }>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kyr_simple_wording");
      if (saved === "true") setSimpleWording(true);
    } catch {}
  }, []);

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
    setShowLetterForm(false); setGeneratedLetter(null); setLetterError(null);
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
    currentOrigQuery: string
  ) => {
    setError(null); setAppState("LOADING"); advanceLoading();
    try {
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
        if (data.user_name || userName.trim()) {
          const prefill = data.user_name || userName.trim();
          setLetterFields(prev => ({
            ...prev,
            employee_name: prev.employee_name || prefill
          }));
        }
        setAppState("RESULT");
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch { setError("Could not connect to backend server. Please verify FastAPI is running at port 8000."); setAppState("EMPTY"); }
  }, [stateCode, advanceLoading, userName]);

  const handleFirstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 10) return;
    const initialText = query.trim();
    setOriginalQuery(initialText);
    submit(initialText, {}, 0, [], initialText);
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyAnswer.trim()) return;
    submit(clarifyAnswer.trim(), sessionFacts, clarificationRound, askedFacts, originalQuery);
  };

  const handleSkipClarify = () => {
    submit("SKIP", sessionFacts, clarificationRound, askedFacts, originalQuery);
  };

  const handleSelectLanguage = async (langCode: string) => {
    if (langCode === selectedLanguage) return;
    if (langCode === "en") {
      setSelectedLanguage("en");
      return;
    }

    if (translations[langCode]) {
      setSelectedLanguage(langCode);
      return;
    }

    if (!result) return;

    setSelectedLanguage(langCode);
    setIsTranslating(true);
    setTranslationError(null);

    try {
      const res = await fetch(`${API}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_language: langCode,
          answer: result.answer,
          answerSimple: result.answerSimple,
          evidence_reasons: result.evidence?.reasons,
          pathway_authority: result.pathway?.authority,
          pathway_deadline: result.pathway?.deadlineNote,
          pathway_steps: result.pathway?.steps?.map((s) => ({
            title: s.title,
            detail: s.detail,
            docs: s.docs || [],
          })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.detail || "Translation request failed";
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      const data = await res.json();
      const mergedSteps = result.pathway?.steps
        ? result.pathway.steps.map((orig, i) => {
            const tr = data.pathway_steps?.[i];
            return {
              ...orig,
              title: tr?.title || orig.title,
              detail: tr?.detail || orig.detail,
              docs: tr?.docs && Array.isArray(tr.docs) && tr.docs.length > 0 ? tr.docs : orig.docs,
            };
          })
        : data.pathway_steps;

      setGeneratedLetter(null);
      setTranslations((prev) => ({
        ...prev,
        [langCode]: {
          answer: data.answer,
          answerSimple: data.answerSimple,
          evidence_reasons: data.evidence_reasons,
          pathway_authority: data.pathway_authority,
          pathway_deadline: data.pathway_deadline,
          pathway_steps: mergedSteps,
        },
      }));
    } catch (err: unknown) {
      console.error("Translation error:", err);
      const msg = err instanceof Error ? err.message : "Translation failed. Displaying English version.";
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
    const jurisdictionLabel = STATE_LABELS[stateCode] || stateCode;
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

    const citationsHtml = result.citations && result.citations.length > 0
      ? result.citations
          .map((c, i) => `
            <div style="padding: 8px 12px; border: 1px solid #d1d5db; margin-bottom: 6px; background-color: #fafafa; border-radius: 2px;">
              <div style="font-family: 'Times New Roman', serif; font-size: 13px; font-weight: bold; color: #111827;">
                §${(i + 1).toString().padStart(2, "0")}. ${renderText(c.act)}
              </div>
              <div style="font-family: monospace; font-size: 11px; color: #4b5563; margin-top: 2px;">
                Section ${renderText(c.section)} · Jurisdiction: ${renderText(c.jurisdiction).toUpperCase()}
              </div>
            </div>
          `)
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

  const handleGenerateLetter = async () => {
    if (!result) return;
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
          language: selectedLanguage,
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
                EST. · INDIAN STATUTORY ARCHIVE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            {appState === "HOME" ? (
              <>
                <a href="#how-it-works" className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">
                  [ How it works ]
                </a>
                <button
                  type="button"
                  onClick={handleHeaderNewQuery}
                  className="border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] px-3.5 py-1.5 font-bold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  [ New query ]
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="text-[var(--text-2)] hover:text-[var(--text-1)] cursor-pointer"
                >
                  [ Home ]
                </button>
                <button
                  type="button"
                  onClick={() => setHowModalOpen(true)}
                  className="text-[var(--text-2)] hover:text-[var(--text-1)] cursor-pointer"
                >
                  [ How it works ]
                </button>
                <button
                  type="button"
                  onClick={handleNewQuestion}
                  className="border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] px-3 py-1 font-bold cursor-pointer hover:opacity-90"
                >
                  + NEW QUERY
                </button>
              </>
            )}
          </div>
        </header>

        <HowItWorksModal open={howModalOpen} onClose={() => setHowModalOpen(false)} />

        {appState === "HOME" && (
          <Homepage
            userName={userName}
            setUserName={setUserName}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            onStartQuery={handleStartFromHomepage}
            onOpenHowModal={() => setHowModalOpen(true)}
          />
        )}

        {appState === "EMPTY" && (
          <main className="py-8 sm:py-10 animate-fade-up">
            {/* Session Context Bar */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6 font-mono text-xs text-[var(--text-3)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent-crimson)] font-bold">● INQUIRY WORKSPACE</span>
                <span>·</span>
                <span>
                  APPLICANT: {userName.trim() ? userName.trim().toUpperCase() : "ANONYMOUS"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[var(--text-2)]">TERMS ACKNOWLEDGED ✓</span>
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="text-[var(--text-3)] hover:text-[var(--text-1)] underline cursor-pointer"
                >
                  ← Back to overview
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase">
                  LEGAL INFORMATION & RECOURSE
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[var(--text-1)] leading-tight">
                Tell us what happened.
              </h1>
              <p className="text-2xl sm:text-3xl font-serif text-[var(--text-2)] italic mt-1">
                We&apos;ll find the law.
              </p>
            </div>

            <form onSubmit={handleFirstSubmit} className="space-y-8">

              {/* Jurisdiction Selector */}
              <div>
                <label className="block text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-3">
                  WHERE DOES THIS APPLY?
                </label>
                <div className="flex flex-wrap gap-2 font-mono text-xs font-bold uppercase">
                  {(Object.entries(STATE_LABELS) as [StateCode, string][]).map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setStateCode(code)}
                      className={`px-5 py-2.5 border transition-all ${
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
                    WHAT HAPPENED?
                  </label>
                  <span className={`text-xs font-mono ${charCount > 800 ? "text-[var(--accent-crimson)]" : "text-[var(--text-3)]"}`}>
                    {charCount} / 1000
                  </span>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-5 focus-within:border-[var(--text-1)] transition-colors">
                  <textarea
                    value={query}
                    onChange={e => { setQuery(e.target.value); setCharCount(e.target.value.length); }}
                    placeholder="Tell us what happened..."
                    rows={7}
                    maxLength={1000}
                    className="w-full bg-transparent text-[var(--text-1)] text-base sm:text-lg placeholder:text-[var(--text-4)] focus:outline-none resize-y leading-relaxed font-sans"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-[var(--bg-subtle)] border-l-2 border-[var(--accent-crimson)] text-[var(--accent-crimson)] text-xs font-mono">
                  [ERROR] {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
              )}

              <hr className="border-t border-[var(--border)] my-6" />

              {/* Submit action button */}
              <button
                type="submit"
                suppressHydrationWarning
                disabled={query.trim().length < 10}
                className={`w-full py-4 text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase transition-all border ${
                  query.trim().length >= 10
                    ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] hover:opacity-90 cursor-pointer shadow-sm"
                    : "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
                }`}
              >
                [ ANALYZE CASE ]
              </button>
            </form>

            {/* Bottom Metadata */}
            <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-between font-mono text-xs text-[var(--text-3)] flex-wrap gap-4">
              <div>
                <span className="block font-bold text-[var(--text-2)] tracking-wider uppercase mb-0.5">JURISDICTIONS COVERED</span>
                <span>TAMIL NADU · MAHARASHTRA · KARNATAKA</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[var(--text-2)] tracking-wider uppercase">VERIFIED LEGAL SOURCES</span>
              </div>
            </div>

            {/* Start with an example section */}
            <div className="mt-12">
              <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                START WITH AN EXAMPLE
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                {EXAMPLE_QUERIES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(ex.text); setCharCount(ex.text.length); }}
                    className="p-4 border border-[var(--border)] bg-[var(--bg-surface)] text-left interactive-paper flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
                        <span className="text-[var(--accent-crimson)] font-bold">{ex.ref}</span>
                        <span className="text-[var(--text-3)] group-hover:text-[var(--text-1)] font-bold">USE THIS →</span>
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
            <LoadingChecklist step={loadingStep} />
          </main>
        )}

        {appState === "CLARIFICATION" && (
          <main className="py-8 animate-fade-up max-w-2xl mx-auto font-sans">
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-10 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6 font-mono text-xs text-[var(--text-3)]">
                <span className="font-bold text-[var(--text-1)]">STATUTORY INTAKE</span>
                <span>FACT INTAKE {clarifyTurn} OF {MAX_TURNS}</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="legal-stamp">STATUTORY INTAKE</span>
                </div>
                <p className="text-xs text-[var(--text-2)] font-serif italic mb-4">
                  One fact is needed before we can determine which statutory provisions apply.
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
                  className="w-full p-4 border border-[var(--border)] bg-[var(--bg-subtle)] text-base text-[var(--text-1)] placeholder:text-[var(--text-4)] focus:outline-none focus:border-[var(--text-1)] font-sans"
                />
                <div className="flex gap-3 font-mono text-xs font-bold uppercase">
                  <button
                    type="submit"
                    disabled={!clarifyAnswer.trim()}
                    className={`flex-1 py-3.5 border transition-all ${
                      clarifyAnswer.trim()
                        ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] cursor-pointer"
                        : "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
                    }`}
                  >
                    CONTINUE →
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipClarify}
                    className="px-5 py-3.5 text-[var(--text-3)] hover:text-[var(--text-1)] border border-[var(--border)] cursor-pointer"
                  >
                    SKIP
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
              <div className="flex items-center justify-between border-b-2 border-[var(--text-1)] pb-4 mb-8 font-mono text-xs flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base tracking-wider text-[var(--text-1)]">
                    LEGAL CASE SHEET
                  </span>
                  <span className="legal-stamp">VERIFIED STATUTES</span>
                </div>
                <div className="flex items-center gap-4 text-[var(--text-2)] font-bold">
                  <span>{STATE_LABELS[stateCode].toUpperCase()}</span>
                  <span>·</span>
                  <span>CONFIDENCE: {result.evidence.level.toUpperCase()}</span>
                  <button
                    onClick={exportToPdf}
                    className="px-2.5 py-1 border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--text-1)] text-[var(--text-1)] transition-colors text-[10px] no-print cursor-pointer"
                    title="Export legal brief as PDF document"
                  >
                    [ EXPORT TO PDF ]
                  </button>
                </div>
              </div>

              {/* Language Selector Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-8 p-3 bg-[var(--bg-subtle)] border border-[var(--border)] text-xs font-mono no-print">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
                    🌐 TRANSLATE CASE SHEET:
                  </span>
                  {isTranslating && (
                    <span className="text-[var(--accent-crimson)] text-[10px] font-bold animate-pulse">
                      Translating into {LANGUAGES.find(l => l.code === selectedLanguage)?.name}...
                    </span>
                  )}
                  {translationError && (
                    <span className="text-[var(--accent-crimson)] text-[10px]">
                      {translationError}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      disabled={isTranslating}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`px-2.5 py-1 text-[11px] font-mono transition-colors border cursor-pointer ${
                        selectedLanguage === lang.code
                          ? "bg-[var(--text-1)] text-[var(--bg)] font-bold border-[var(--text-1)] shadow-xs"
                          : "bg-[var(--bg-surface)] text-[var(--text-2)] hover:text-[var(--text-1)] border-[var(--border)]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reported facts */}
              <div className="mb-8">
                <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-2">
                  WHAT YOU REPORTED
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
                    LEGAL POSITION & STATUTORY SUMMARY
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
                      DETAILED STATUTORY
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
                      SIMPLER WORDING
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
                      {result.citations.length > 0 && (
                        <div>
                          <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                            {sectionHeaders.provisions} ({result.citations.length})
                          </p>
                          <div className="space-y-3 font-sans">
                            {result.citations.map((c, i) => (
                              <div key={i} className="p-4 border border-[var(--border)] bg-[var(--bg-subtle)] flex items-start gap-4 interactive-paper">
                                <span className="font-mono font-bold text-sm text-[var(--accent-crimson)]">
                                  §{(i + 1).toString().padStart(2, "0")}
                                </span>
                                <div>
                                  <p className="text-base font-serif font-bold text-[var(--text-1)]">{renderText(c.act)}</p>
                                  <p className="text-xs font-mono text-[var(--text-2)] mt-1">Section {renderText(c.section)} · {renderText(c.jurisdiction).toUpperCase()}</p>
                                </div>
                              </div>
                            ))}
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
                                onChange={e => setLetterFields({ employee_name: e.target.value })}
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
                                onClick={handleGenerateLetter}
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
                                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)]">
                                    {noticeUi.previewHeading}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleDownloadDocx}
                                    className="px-4 py-2 border border-[var(--border-strong)] bg-[var(--text-1)] text-[var(--bg)] text-xs font-mono font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-sm"
                                  >
                                    <span>⬇</span> {noticeUi.downloadBtn}
                                  </button>
                                </div>
                                <pre className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] text-xs sm:text-sm font-mono text-[var(--text-1)] whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
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

            <DebugPanel data={result.ragDebug} />
          </main>
        )}
      </div>
    </div>
  );
}