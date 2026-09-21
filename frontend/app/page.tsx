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

function PathwayStepRow({ step, i, total }: { step: PathwayStep; i: number; total: number }) {
  const [open, setOpen] = useState(i === 0);
  const numStr = (i + 1).toString().padStart(2, "0");
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
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">REQUIRED STATUTORY RECORDS</p>
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
    employee_address: "",
    counterparty_name: "",
    counterparty_address: "",
    joining_date: "",
    designation: "",
    amount_claimed: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<{ text: string; html: string } | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);

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

  const exportToPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
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
          fields: letterFields,
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

  const printNoticeLetter = () => {
    if (!generatedLetter) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(generatedLetter.html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  const downloadLetterText = () => {
    if (!generatedLetter) return;
    const blob = new Blob([generatedLetter.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Legal_Notice_${(result?.detectedCategory || "claim").toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                  {renderText(simpleWording && result.answerSimple ? result.answerSimple : result.answer)
                    .split("\n")
                    .map((para, i) => (para.trim() ? <p key={i}>{para}</p> : null))}
                </div>
              </div>

              <hr className="border-t border-[var(--border)] my-8" />

              {/* Grid section for Statutory Provisions & Evidence */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Applicable Provisions */}
                {result.citations.length > 0 && (
                  <div>
                    <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                      APPLICABLE STATUTORY PROVISIONS ({result.citations.length})
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
                    EVIDENCE PRECONDITION ANALYSIS
                  </p>
                  <div className="p-4 border border-[var(--border)] font-sans space-y-2.5">
                    {result.evidence.reasons.map((r, i) => (
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
                    NEXT STEPS & PROCEDURAL PATHWAY
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 font-sans">
                    <div className="p-4 border border-[var(--border)] bg-[var(--bg-subtle)]">
                      <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-1">AUTHORITY TO APPROACH</p>
                      <p className="text-base font-serif font-bold text-[var(--text-1)]">{renderText(result.pathway.authority)}</p>
                    </div>
                    <div className="p-4 border border-[var(--border)]">
                      <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-1">STATUTORY DEADLINE</p>
                      <p className="text-xs text-[var(--text-1)] leading-relaxed">{renderText(result.pathway.deadlineNote)}</p>
                    </div>
                  </div>

                  <div className="border border-[var(--border)] p-4 sm:p-6 font-sans">
                    <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-3">ACTION STEPS</p>
                    {result.pathway.steps.map((s, i) => <PathwayStepRow key={i} step={s} i={i} total={result.pathway.steps.length} />)}
                  </div>
                </div>
              )}

              {/* Optional Notice Letter Generator Section — Only rendered when letterEligible is true */}
              {result.letterEligible && (
                <div className="mt-8 border border-[var(--border)] bg-[var(--bg-subtle)] p-6 no-print">
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border)] pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--accent-crimson)]">§ FORMAL NOTICE DRAFT</span>
                      </div>
                      <h4 className="text-lg font-serif font-bold text-[var(--text-1)] mt-1">
                        Want a ready-to-send notice letter?
                      </h4>
                      <p className="text-xs text-[var(--text-2)] font-sans mt-0.5">
                        Generate an official legal notice citing verified statutes. Personal fields are processed locally and never sent to any AI.
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
                      {showLetterForm ? "HIDE FORM [-]" : "+ CREATE NOTICE LETTER"}
                    </button>
                  </div>

                  {showLetterForm && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            YOUR FULL NAME *
                          </label>
                          <input
                            type="text"
                            value={letterFields.employee_name}
                            onChange={e => setLetterFields({ ...letterFields, employee_name: e.target.value })}
                            placeholder="e.g. Priya Sundaram"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            YOUR POSTAL ADDRESS *
                          </label>
                          <input
                            type="text"
                            value={letterFields.employee_address}
                            onChange={e => setLetterFields({ ...letterFields, employee_address: e.target.value })}
                            placeholder="e.g. No. 14, Anna Nagar, Chennai"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            EMPLOYER / LANDLORD NAME *
                          </label>
                          <input
                            type="text"
                            value={letterFields.counterparty_name}
                            onChange={e => setLetterFields({ ...letterFields, counterparty_name: e.target.value })}
                            placeholder="e.g. Apex Technologies Pvt Ltd"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            EMPLOYER / LANDLORD ADDRESS *
                          </label>
                          <input
                            type="text"
                            value={letterFields.counterparty_address}
                            onChange={e => setLetterFields({ ...letterFields, counterparty_address: e.target.value })}
                            placeholder="e.g. OMR IT Corridor, Chennai"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            JOINING / LEASE START DATE (OPTIONAL)
                          </label>
                          <input
                            type="text"
                            value={letterFields.joining_date}
                            onChange={e => setLetterFields({ ...letterFields, joining_date: e.target.value })}
                            placeholder="e.g. January 2024"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            DESIGNATION / ROLE (OPTIONAL)
                          </label>
                          <input
                            type="text"
                            value={letterFields.designation}
                            onChange={e => setLetterFields({ ...letterFields, designation: e.target.value })}
                            placeholder="e.g. Senior Associate"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-3)] mb-1">
                            AMOUNT OR PERIOD CLAIMED (OPTIONAL)
                          </label>
                          <input
                            type="text"
                            value={letterFields.amount_claimed}
                            onChange={e => setLetterFields({ ...letterFields, amount_claimed: e.target.value })}
                            placeholder="e.g. 2 months salary (₹95,000) or 50,000 security deposit"
                            className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:border-[var(--text-1)]"
                          />
                        </div>
                      </div>

                      {letterError && (
                        <div className="p-3 bg-[var(--bg-surface)] border border-[var(--accent-crimson)] text-[var(--accent-crimson)] text-xs font-mono">
                          [ERROR] {letterError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleGenerateLetter}
                          disabled={letterLoading}
                          className="px-5 py-2.5 bg-[var(--text-1)] text-[var(--bg)] font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          {letterLoading ? "GENERATING..." : "PREVIEW & GENERATE NOTICE LETTER"}
                        </button>
                      </div>

                      {/* Rendered Letter Preview & Dual Export Buttons */}
                      {generatedLetter && (
                        <div className="mt-6 pt-6 border-t border-[var(--border)]">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)]">
                              GENERATED NOTICE LETTER PREVIEW
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={downloadLetterText}
                                className="px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-1)] text-[var(--text-1)] text-xs font-mono transition-colors cursor-pointer"
                              >
                                DOWNLOAD .TXT
                              </button>
                              <button
                                type="button"
                                onClick={printNoticeLetter}
                                className="px-3 py-1.5 border border-[var(--border-strong)] bg-[var(--text-1)] text-[var(--bg)] text-xs font-mono font-bold hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                DOWNLOAD NOTICE LETTER (PDF)
                              </button>
                            </div>
                          </div>
                          <pre className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-1)] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                            {generatedLetter.text}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DebugPanel data={result.ragDebug} />
          </main>
        )}
      </div>
    </div>
  );
}