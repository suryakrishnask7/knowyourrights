"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SHOW_DEBUG = process.env.NEXT_PUBLIC_SHOW_DEBUG === "true";
const CASE_KEY = "knowyourrights_case_id";
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
  case_id?: string; needsClarification?: boolean;
  clarifyingQuestion?: string; clarifyingReason?: string;
  turnCount?: number; maxTurns?: number; hasDirectRecourse?: boolean;
};
type CaseState = {
  case_id: string; status: string; original_query: string;
  category?: string | null; clarification_round?: number;
  clarifyingQuestion?: string | null; result?: QueryResult | null;
};

const T = {
  bg: "var(--bg)", bgSubtle: "var(--bg-subtle)", bgMuted: "var(--bg-muted)",
  border: "var(--border)", borderMid: "var(--border-mid)",
  t1: "var(--text-1)", t2: "var(--text-2)", t3: "var(--text-3)", t4: "var(--text-4)",
  accent: "var(--accent)", accentFg: "var(--accent-fg)",
};

const STATE_LABELS: Record<StateCode, string> = { TN: "Tamil Nadu", MH: "Maharashtra", KA: "Karnataka" };
const EV_CFG = {
  High:   { c: "#16a34a", bg: "rgba(22,163,74,0.08)",  br: "rgba(22,163,74,0.22)"  },
  Medium: { c: "#b45309", bg: "rgba(180,83,9,0.08)",   br: "rgba(180,83,9,0.22)"   },
  Low:    { c: "#dc2626", bg: "rgba(220,38,38,0.08)",  br: "rgba(220,38,38,0.22)"  },
} as const;

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const s = localStorage.getItem("kyr-theme");
    const d = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const t = (s as "light" | "dark") || (d ? "dark" : "light");
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);
  const toggle = () => {
    const n = theme === "light" ? "dark" : "light";
    setTheme(n);
    document.documentElement.setAttribute("data-theme", n);
    localStorage.setItem("kyr-theme", n);
  };
  return { theme, toggle };
}

const PIPELINE_STEPS = [
  "Understanding your situation",
  "Identifying the legal category",
  "Searching applicable legislation",
  "Checking evidence quality",
  "Preparing your next steps",
];

function LoadingChecklist({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "40px 0", maxWidth: 420, margin: "0 auto" }}>
      <p style={{ fontSize: 13, color: T.t3, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
        Analysing your situation
      </p>
      {PIPELINE_STEPS.map((s, i) => {
        const done = i < step; const active = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              background: done ? T.accent : active ? "rgba(99,102,241,0.12)" : T.bgMuted,
              border: active ? "1.5px solid #6366f1" : done ? "none" : `1px solid ${T.border}`,
              color: done ? T.accentFg : active ? "#6366f1" : T.t4,
              animation: active ? "pulse 1.2s ease-in-out infinite" : "none",
            }}>
              {done ? "✓" : active ? "●" : "○"}
            </span>
            <span style={{ fontSize: 14, color: done ? T.t1 : active ? T.t1 : T.t4, fontWeight: active ? 500 : 400, transition: "color 0.3s" }}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const cfg = EV_CFG[level];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.br}`, fontSize: 11, fontWeight: 600, color: cfg.c, letterSpacing: "0.03em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.c }} />
      {level} confidence
    </span>
  );
}

function CitationCard({ c, i, total }: { c: Citation; i: number; total: number }) {
  const isState = c.jurisdiction !== "central";
  const loc = isState ? (STATE_LABELS[c.jurisdiction as StateCode] ?? c.jurisdiction) : "Central Law";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < total - 1 ? `1px solid ${T.border}` : "none" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.bgMuted, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.t3, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: T.t1, lineHeight: 1.45, marginBottom: 5 }}>{c.act}</p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[c.section, loc].map((tag, ti) => (
            <span key={ti} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, border: `1px solid ${ti === 1 && isState ? "rgba(99,102,241,0.3)" : T.border}`, background: ti === 1 && isState ? "rgba(99,102,241,0.06)" : T.bgSubtle, color: ti === 1 && isState ? "#6366f1" : T.t2 }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PathwayStepRow({ step, i, total }: { step: PathwayStep; i: number; total: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div style={{ borderBottom: i < total - 1 ? `1px solid ${T.border}` : "none" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `1px solid ${open ? T.accent : T.borderMid}`, background: open ? T.accent : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: open ? T.accentFg : T.t3, transition: "all 0.15s" }}>{i + 1}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: open ? 600 : 400, color: open ? T.t1 : T.t2 }}>{step.title}</span>
        <span style={{ color: T.t4, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 34, paddingBottom: 14, animation: "fadeUp 0.18s ease both" }}>
          <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.75, marginBottom: step.docs?.length ? 10 : 0 }}>{step.detail}</p>
          {step.docs && step.docs.length > 0 && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: T.bgSubtle, border: `1px solid ${T.border}`, marginTop: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.t3, marginBottom: 6 }}>Documents needed</p>
              {step.docs.map((d, di) => (
                <div key={di} style={{ display: "flex", gap: 8, padding: "2px 0", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 9, color: T.t3, marginTop: 4 }}>✓</span>
                  <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t3, marginBottom: 12 }}>{label}</p>
      {children}
    </div>
  );
}

function DebugPanel({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (!SHOW_DEBUG) return null;
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.bgSubtle, fontFamily: "monospace", marginTop: 32 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 11, color: T.t3 }}>⚙ Pipeline trace</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: T.t4 }}>{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <pre style={{ padding: 14, fontSize: 11, color: T.t2, overflowX: "auto", maxHeight: 400 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Home() {
  const { theme, toggle } = useTheme();
  const [appState, setAppState] = useState<AppState>("EMPTY");
  const [loadingStep, setLoadingStep] = useState(0);
  const [stateCode, setStateCode] = useState<StateCode>("TN");
  const [query, setQuery] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [clarifyQ, setClarifyQ] = useState("");
  const [clarifyReason, setClarifyReason] = useState("");
  const [clarifyTurn, setClarifyTurn] = useState(1);
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [originalQuery, setOriginalQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Page-load: restore from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CASE_KEY);
    if (!stored) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/case/${stored}`);
        if (!res.ok) { localStorage.removeItem(CASE_KEY); return; }
        const caseData: CaseState = await res.json();
        setCaseId(caseData.case_id);
        if (caseData.status === "resolved" && caseData.result) {
          setOriginalQuery(caseData.original_query);
          setResult(caseData.result as QueryResult);
          setAppState("RESULT");
        } else if (caseData.status === "awaiting_clarification" && caseData.clarifyingQuestion) {
          setOriginalQuery(caseData.original_query);
          setClarifyQ(caseData.clarifyingQuestion);
          setClarifyTurn(caseData.clarification_round ?? 1);
          setAppState("CLARIFICATION");
        }
      } catch { localStorage.removeItem(CASE_KEY); }
    })();
  }, []);

  useEffect(() => { if (caseId) localStorage.setItem(CASE_KEY, caseId); }, [caseId]);

  const handleNewQuestion = useCallback(() => {
    localStorage.removeItem(CASE_KEY);
    setCaseId(null); setQuery(""); setCharCount(0); setClarifyAnswer("");
    setClarifyQ(""); setResult(null); setOriginalQuery(""); setError(null);
    setLoadingStep(0); setAppState("EMPTY");
  }, []);

  const advanceLoading = useCallback(() => {
    setLoadingStep(0);
    [400, 900, 1800, 3200, 4400].forEach((d, i) => setTimeout(() => setLoadingStep(i + 1), d));
  }, []);

  const submit = useCallback(async (queryText: string, existingCaseId: string | null) => {
    setError(null); setAppState("LOADING"); advanceLoading();
    try {
      const res = await fetch(`${API}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, state: stateCode, case_id: existingCaseId ?? undefined }),
      });
      const data: QueryResult = await res.json();
      if (!res.ok) { setError((data as unknown as { detail?: string }).detail ?? "Request failed."); setAppState("EMPTY"); return; }
      if (data.case_id) setCaseId(data.case_id);
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
    } catch { setError("Could not connect to the backend. Please ensure the FastAPI server is running."); setAppState("EMPTY"); }
  }, [stateCode, advanceLoading]);

  const handleFirstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 10) return;
    setOriginalQuery(query.trim()); submit(query.trim(), caseId);
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyAnswer.trim()) return;
    submit(`${originalQuery} [Additional context: ${clarifyAnswer.trim()}]`, caseId);
  };

  const STYLES = `
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  `;

  const header = (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: T.bg, borderBottom: `1px solid ${T.border}`, height: 52, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: "-0.01em", flex: 1 }}>KnowYourRights</span>
      {appState !== "EMPTY" && (
        <button onClick={handleNewQuestion} style={{ fontSize: 13, fontWeight: 500, color: T.t2, background: "none", border: `1px solid ${T.border}`, padding: "5px 14px", borderRadius: 6, cursor: "pointer" }}>
          + New question
        </button>
      )}
      <button onClick={toggle} style={{ background: T.bgMuted, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 13, color: T.t2 }}>
        {theme === "light" ? "◑" : "○"}
      </button>
    </header>
  );

  if (appState === "EMPTY") return (
    <><style>{STYLES}</style>{header}
    <main style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 640, animation: "fadeUp 0.4s ease both" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: T.t1, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 10 }}>Understand your legal rights</h1>
        <p style={{ fontSize: 16, color: T.t2, lineHeight: 1.6, marginBottom: 36 }}>Describe your situation in plain language. Get grounded answers backed by Indian legislation.</p>
        <form onSubmit={handleFirstSubmit}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.t3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Your state</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.entries(STATE_LABELS) as [StateCode, string][]).map(([code, label]) => (
                <button key={code} type="button" onClick={() => setStateCode(code)} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", background: stateCode === code ? T.accent : T.bgMuted, color: stateCode === code ? T.accentFg : T.t2, border: stateCode === code ? "none" : `1px solid ${T.border}` }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea value={query} onChange={e => { setQuery(e.target.value); setCharCount(e.target.value.length); }} placeholder="e.g. My employer hasn't paid my salary for 2 months..." rows={5} maxLength={1000} style={{ width: "100%", padding: "14px 16px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.bgSubtle, color: T.t1, fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none" }} onFocus={e => e.currentTarget.style.borderColor = T.borderMid} onBlur={e => e.currentTarget.style.borderColor = T.border} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: T.t4 }}>Aim for 200–500 characters for best results</span>
              <span style={{ fontSize: 11, color: charCount > 800 ? "#dc2626" : T.t4 }}>{charCount}/1000</span>
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12, padding: "8px 12px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6 }}>{error}</p>}
          <button type="submit" suppressHydrationWarning disabled={query.trim().length < 10} style={{ width: "100%", padding: "13px 24px", background: query.trim().length >= 10 ? T.accent : T.bgMuted, color: query.trim().length >= 10 ? T.accentFg : T.t4, border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: query.trim().length >= 10 ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
            Understand my rights →
          </button>
        </form>
        <div style={{ marginTop: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: T.t4, marginBottom: 12 }}>Examples</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["My employer hasn't paid my salary for 2 months.", "PF was deducted from my payslip but not deposited to EPFO.", "I resigned after 6 years and HR is refusing to pay gratuity.", "Landlord is refusing to refund my 3-month security deposit.", "I was fired without written notice or retrenchment compensation."].map((ex, i) => (
              <button key={i} type="button" onClick={() => { setQuery(ex); setCharCount(ex.length); }} style={{ textAlign: "left", fontSize: 13, color: T.t2, background: "none", border: `1px solid ${T.border}`, padding: "8px 12px", borderRadius: 6, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = T.bgSubtle} onMouseLeave={e => e.currentTarget.style.background = "none"}>{ex}</button>
            ))}
          </div>
        </div>
      </div>
    </main></>
  );

  if (appState === "LOADING") return (
    <><style>{STYLES}</style>{header}
    <main style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.3s ease both" }}>
        <div style={{ padding: "24px 28px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgSubtle, marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.t4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Your situation</p>
          <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.65, fontStyle: "italic" }}>&ldquo;{originalQuery}&rdquo;</p>
        </div>
        <LoadingChecklist step={loadingStep} />
      </div>
    </main></>
  );

  if (appState === "CLARIFICATION") return (
    <><style>{STYLES}</style>{header}
    <main style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 560, animation: "fadeUp 0.3s ease both" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.22)", fontSize: 11, fontWeight: 600, color: "#6366f1", marginBottom: 14, letterSpacing: "0.03em" }}>
            Question {clarifyTurn} of {MAX_TURNS}
          </div>
          <p style={{ fontSize: 13, color: T.t3, marginBottom: 16, lineHeight: 1.6 }}>We found relevant legal provisions, but one detail affects which rules apply to your situation.</p>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: T.t1, lineHeight: 1.4 }}>{clarifyQ}</h2>
          {clarifyReason && <p style={{ fontSize: 13, color: T.t3, marginTop: 8 }}>{clarifyReason}</p>}
        </div>
        <form onSubmit={handleClarifySubmit}>
          <textarea value={clarifyAnswer} onChange={e => setClarifyAnswer(e.target.value)} placeholder="Type your answer here…" rows={3} autoFocus style={{ width: "100%", padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.bgSubtle, color: T.t1, fontSize: 14, lineHeight: 1.6, resize: "none", outline: "none", marginBottom: 12 }} onFocus={e => e.currentTarget.style.borderColor = "#6366f1"} onBlur={e => e.currentTarget.style.borderColor = T.border} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={!clarifyAnswer.trim()} style={{ flex: 1, padding: "11px 20px", background: clarifyAnswer.trim() ? T.accent : T.bgMuted, color: clarifyAnswer.trim() ? T.accentFg : T.t4, border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: clarifyAnswer.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>Continue →</button>
            <button type="button" onClick={() => submit(originalQuery, caseId)} style={{ padding: "11px 16px", background: "none", color: T.t3, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, cursor: "pointer" }}>Skip</button>
          </div>
        </form>
        <div style={{ marginTop: 24, padding: "12px 14px", borderRadius: 7, background: T.bgMuted }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: T.t4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Your original situation</p>
          <p style={{ fontSize: 12, color: T.t3, lineHeight: 1.6 }}>&ldquo;{originalQuery}&rdquo;</p>
        </div>
      </div>
    </main></>
  );

  if (appState === "RESULT" && result) {
    const ev = result.evidence;
    const evCfg = EV_CFG[ev.level];
    const categoryLabel = result.detectedCategory?.replace(/_/g, " ") ?? "";
    return (
      <><style>{STYLES}</style>{header}
      <main ref={resultRef} style={{ maxWidth: 740, margin: "0 auto", padding: "40px 24px 80px", animation: "fadeUp 0.3s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {categoryLabel && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: T.bgMuted, border: `1px solid ${T.border}`, color: T.t2, letterSpacing: "0.03em", textTransform: "capitalize" }}>{categoryLabel}</span>}
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: T.bgMuted, border: `1px solid ${T.border}`, color: T.t2 }}>{STATE_LABELS[stateCode]}</span>
          <EvidenceBadge level={ev.level} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: 8, background: T.bgSubtle, border: `1px solid ${T.border}`, marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t3, marginBottom: 6 }}>What you reported</p>
          <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.65, fontStyle: "italic" }}>&ldquo;{originalQuery}&rdquo;</p>
        </div>
        <Section label="Legal assessment">
          <div style={{ fontSize: 15, color: T.t1, lineHeight: 1.8 }}>
            {result.answer.split("\n").map((para, i) => para.trim() ? <p key={i} style={{ marginBottom: 14 }}>{para}</p> : null)}
          </div>
        </Section>
        {result.citations.length > 0 && (
          <Section label={`Sources · ${result.citations.length} provision${result.citations.length !== 1 ? "s" : ""}`}>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 16px" }}>
              {result.citations.map((c, i) => <CitationCard key={i} c={c} i={i} total={result.citations.length} />)}
            </div>
          </Section>
        )}
        <Section label="Evidence quality">
          <div style={{ padding: "14px 16px", borderRadius: 8, background: evCfg.bg, border: `1px solid ${evCfg.br}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: evCfg.c }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: evCfg.c }}>{ev.level} confidence</span>
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
              {ev.reasons.map((r, i) => (
                <li key={i} style={{ fontSize: 12, color: T.t2, lineHeight: 1.55, paddingLeft: 14, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 7, width: 4, height: 4, borderRadius: "50%", background: T.t4 }} />
                  {r}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 11, color: T.t4, marginTop: 10, fontStyle: "italic" }}>Reflects provisions retrieved — not a prediction of legal outcome.</p>
          </div>
        </Section>
        {result.pathway && result.hasDirectRecourse !== false && result.evidence?.level !== "Low" && (
          <Section label="What you can do">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", borderRadius: 7, background: T.bgSubtle, border: `1px solid ${T.border}`, marginBottom: 10 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🏛</span>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.t3, marginBottom: 3 }}>Authority to approach</p>
                <p style={{ fontSize: 13, color: T.t1, lineHeight: 1.55 }}>{result.pathway.authority}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "11px 13px", borderRadius: 7, background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.18)", marginBottom: 20 }}>
              <span style={{ color: "#b45309", fontSize: 14, flexShrink: 0 }}>⏱</span>
              <p style={{ fontSize: 13, color: "#b45309", lineHeight: 1.6 }}>{result.pathway.deadlineNote}</p>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.t4, marginBottom: 2 }}>Steps · tap each to expand</p>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "0 16px" }}>
              {result.pathway.steps.map((s, i) => <PathwayStepRow key={i} step={s} i={i} total={result.pathway.steps.length} />)}
            </div>
          </Section>
        )}
        <DebugPanel data={result.ragDebug} />
      </main></>
    );
  }

  return null;
}
