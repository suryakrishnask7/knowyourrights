"use client";

import { useState, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SHOW_DEBUG = process.env.NEXT_PUBLIC_SHOW_DEBUG === "true";
const MAX_TURNS = 2;

type AppState = "EMPTY" | "LOADING" | "CLARIFICATION" | "RESULT";
type StateCode = "TN" | "MH" | "KA";
type Citation    = { act: string; section: string; jurisdiction: string };
type Evidence    = { level: "High" | "Medium" | "Low"; reasons: string[] };
type PathwayStep = { title: string; detail: string; docs?: string[] };
type Pathway     = { authority: string; deadlineNote: string; steps: PathwayStep[] };
type QueryResult = {
  answer: string; citations: Citation[]; evidence: Evidence;
  pathway: Pathway; detectedCategory: string | null; ragDebug?: unknown;
  needsClarification?: boolean; clarifyingQuestion?: string; clarifyingReason?: string;
  turnCount?: number; maxTurns?: number; hasDirectRecourse?: boolean;
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
          {step.title}
        </span>
        <span className="text-xs font-mono text-[var(--text-3)]">{open ? "[-]" : "[+]"}</span>
      </button>
      {open && (
        <div className="pl-8 pb-4 space-y-3 font-sans animate-fade-up">
          <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">{step.detail}</p>
          {step.docs && step.docs.length > 0 && (
            <div className="mt-3 p-3 bg-[var(--bg-subtle)] border border-[var(--border)]">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">REQUIRED STATUTORY RECORDS</p>
              <ul className="space-y-1">
                {step.docs.map((d, di) => (
                  <li key={di} className="text-xs text-[var(--text-1)] font-mono flex items-center gap-2">
                    <span className="text-[var(--accent-crimson)] font-bold">—</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DebugPanel({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (!SHOW_DEBUG) return null;
  return (
    <div className="mt-8 border border-[var(--border)] bg-[var(--bg-subtle)] font-mono text-xs">
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
  const [appState, setAppState] = useState<AppState>("EMPTY");
  const [loadingStep, setLoadingStep] = useState(0);
  const [stateCode, setStateCode] = useState<StateCode>("TN");
  const [query, setQuery] = useState("");
  const [charCount, setCharCount] = useState(0);
  
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
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleNewQuestion = useCallback(() => {
    setQuery(""); setCharCount(0); setClarifyAnswer("");
    setClarifyQ(""); setResult(null); setOriginalQuery(""); setError(null);
    setSessionFacts({}); setClarificationRound(0); setAskedFacts([]);
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
        }),
      });
      const data: QueryResult = await res.json();
      if (!res.ok) { setError((data as unknown as { detail?: string }).detail ?? "Request failed."); setAppState("EMPTY"); return; }
      
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
        setResult(data); setAppState("RESULT");
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch { setError("Could not connect to backend server. Please verify FastAPI is running at port 8000."); setAppState("EMPTY"); }
  }, [stateCode, advanceLoading]);

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

  const copyLegalBrief = () => {
    if (!result) return;
    const text = `KNOWYOURRIGHTS — STATUTORY LEGAL ANALYSIS BRIEF\nJURISDICTION: ${STATE_LABELS[stateCode]}\nCONFIDENCE: ${result.evidence.level}\n\nREPORTED FACTS:\n"${originalQuery}"\n\nLEGAL POSITION:\n${result.answer}\n\nSTATUTORY PROVISIONS:\n${result.citations.map(c => `- ${c.act} §${c.section}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] font-sans antialiased py-8 px-4 sm:px-8 md:px-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Full-width Editorial Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border)] font-sans">
          <div onClick={handleNewQuestion} className="cursor-pointer flex items-center gap-3">
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
            <button onClick={() => setHowModalOpen(true)} className="text-[var(--text-2)] hover:text-[var(--text-1)]">
              [ How it works ]
            </button>
            {appState !== "EMPTY" && (
              <button onClick={handleNewQuestion} className="border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] px-3 py-1 font-bold">
                + NEW QUERY
              </button>
            )}
          </div>
        </header>

        <HowItWorksModal open={howModalOpen} onClose={() => setHowModalOpen(false)} />

        {appState === "EMPTY" && (
          <main className="py-8 sm:py-10 animate-fade-up">
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
                  [ERROR] {error}
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
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-1)] leading-snug">{clarifyQ}</h2>
                {clarifyReason && <p className="text-xs text-[var(--text-2)] mt-2">{clarifyReason}</p>}
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
                    onClick={copyLegalBrief}
                    className="px-2.5 py-1 border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--text-1)] text-[var(--text-1)] transition-colors text-[10px]"
                  >
                    {copied ? "[ COPIED ✓ ]" : "[ COPY BRIEF ]"}
                  </button>
                </div>
              </div>

              {/* Reported facts */}
              <div className="mb-8">
                <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-2">
                  WHAT YOU REPORTED
                </p>
                <p className="text-xl font-serif italic text-[var(--text-1)] paper-rule-margin leading-relaxed">
                  &ldquo;{originalQuery}&rdquo;
                </p>
              </div>

              <hr className="border-t border-[var(--border)] my-8" />

              {/* Legal Position & Assessment */}
              <div className="mb-8">
                <p className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-4">
                  LEGAL POSITION & STATUTORY SUMMARY
                </p>
                <div className="font-serif text-lg sm:text-xl text-[var(--text-1)] leading-relaxed space-y-4">
                  {result.answer.split("\n").map((para, i) => para.trim() ? <p key={i}>{para}</p> : null)}
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
                            <p className="text-base font-serif font-bold text-[var(--text-1)]">{c.act}</p>
                            <p className="text-xs font-mono text-[var(--text-2)] mt-1">Section {c.section} · {c.jurisdiction.toUpperCase()}</p>
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
                        <span>{r}</span>
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
                      <p className="text-base font-serif font-bold text-[var(--text-1)]">{result.pathway.authority}</p>
                    </div>
                    <div className="p-4 border border-[var(--border)]">
                      <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-1">STATUTORY DEADLINE</p>
                      <p className="text-xs text-[var(--text-1)] leading-relaxed">{result.pathway.deadlineNote}</p>
                    </div>
                  </div>

                  <div className="border border-[var(--border)] p-4 sm:p-6 font-sans">
                    <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-3)] mb-3">ACTION STEPS</p>
                    {result.pathway.steps.map((s, i) => <PathwayStepRow key={i} step={s} i={i} total={result.pathway.steps.length} />)}
                  </div>
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