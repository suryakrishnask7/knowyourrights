"use client";

import { useState, useRef, useEffect, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Citation = { act: string; section: string; jurisdiction: string };
type Evidence = { level: "High" | "Medium" | "Low"; reasons: string[] };
type PathwayStep = { title: string; detail: string; docs?: string[] };
type Pathway = { authority: string; deadlineNote: string; steps: PathwayStep[] };

type ScoredChunkDebug = {
  act: string; section: string; jurisdiction: string; category: string;
  score: number; keywordMatches: string[]; textMatches: string[];
  textPreview: string; selected: boolean;
};
type RagDebug = {
  queryTokens: string[]; totalInCorpus: number;
  filteredByJurisdiction: number; allScored: ScoredChunkDebug[];
};
type QueryResult = {
  answer: string; citations: Citation[]; evidence: Evidence;
  pathway: Pathway; detectedCategory: string | null;
  ragDebug?: RagDebug; error?: string;
};

type State = "TN" | "MH" | "KA";
const STATE_LABELS: Record<State, string> = { TN: "Tamil Nadu", MH: "Maharashtra", KA: "Karnataka" };
const EXAMPLES = [
  "My employer hasn't paid my salary for 2 months.",
  "Company deducted PF from payslip but didn't deposit into EPFO.",
  "I resigned after 6 years of service and HR is refusing gratuity.",
  "Employer is denying 26 weeks paid maternity leave.",
  "Forced to work 60 hours a week without double overtime pay.",
  "Fired without 1-month written notice or retrenchment severance.",
  "How do I file a workplace sexual harassment (POSH) complaint?",
  "Landlord refusing to refund my 3-month security deposit.",
  "Landlord threatening forceful eviction and cutting electricity.",
  "Unilateral 25% rent increase without 3 months prior notice.",
  "Severe ceiling seepage and landlord refuses to repair.",
];

// ─── Theme ────────────────────────────────────────────────────────────────────

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

// ─── Design tokens (accessed via inline CSS vars) ─────────────────────────────

const T = {
  bg: "var(--bg)",
  bgSubtle: "var(--bg-subtle)",
  bgMuted: "var(--bg-muted)",
  border: "var(--border)",
  borderMid: "var(--border-mid)",
  t1: "var(--text-1)",
  t2: "var(--text-2)",
  t3: "var(--text-3)",
  t4: "var(--text-4)",
  accent: "var(--accent)",
  accentFg: "var(--accent-fg)",
};

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ my = 32 }: { my?: number }) {
  return <div style={{ height: 1, background: T.border, margin: `${my}px 0` }} />;
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

const EV_CFG = {
  High: { c: "#16a34a", bg: "rgba(22,163,74,0.08)", br: "rgba(22,163,74,0.18)" },
  Medium: { c: "#b45309", bg: "rgba(180,83,9,0.08)", br: "rgba(180,83,9,0.18)" },
  Low: { c: "#dc2626", bg: "rgba(220,38,38,0.08)", br: "rgba(220,38,38,0.18)" },
} as const;

function EvidenceBlock({ ev }: { ev: Evidence }) {
  const cfg = EV_CFG[ev.level];
  return (
    <div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "5px 12px", borderRadius: 24,
        background: cfg.bg, border: `1px solid ${cfg.br}`,
        marginBottom: 10,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.c, display: "inline-block" }} />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", color: cfg.c }}>
          {ev.level} confidence
        </span>
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
        {ev.reasons.map((r, i) => (
          <li key={i} style={{ fontSize: 13, color: T.t3, lineHeight: 1.55, paddingLeft: 12, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: 8, width: 3, height: 3, borderRadius: "50%", background: T.t4, display: "inline-block" }} />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Citation ─────────────────────────────────────────────────────────────────

function CitationRow({ c, i, total }: { c: Citation; i: number; total: number }) {
  const isState = c.jurisdiction !== "central";
  const loc = isState ? (STATE_LABELS[c.jurisdiction as State] ?? c.jurisdiction) : "Central Law";
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "12px 0",
      borderBottom: i < total - 1 ? `1px solid ${T.border}` : "none",
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: T.bgMuted, border: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: T.t3, flexShrink: 0, marginTop: 2,
      }}>{i + 1}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: T.t1, lineHeight: 1.45, marginBottom: 6 }}>
          {c.act}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[c.section, loc].map((tag, ti) => (
            <span key={ti} style={{
              fontSize: 11, fontWeight: 500,
              padding: "2px 8px", borderRadius: 4,
              border: `1px solid ${ti === 1 && isState ? "rgba(99,102,241,0.3)" : T.border}`,
              background: ti === 1 && isState ? "rgba(99,102,241,0.06)" : T.bgSubtle,
              color: ti === 1 && isState ? "#6366f1" : T.t2,
            }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pathway step ─────────────────────────────────────────────────────────────

function PathwayStepRow({ step, i, total }: { step: PathwayStep; i: number; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: i < total - 1 ? `1px solid ${T.border}` : "none" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "13px 0", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          border: `1px solid ${open ? T.accent : T.borderMid}`,
          background: open ? T.accent : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
          color: open ? T.accentFg : T.t3,
          transition: "all 0.15s ease",
        }}>{i + 1}</span>
        <span style={{
          flex: 1, fontSize: 14, fontWeight: open ? 600 : 400,
          color: open ? T.t1 : T.t2,
          transition: "color 0.15s, font-weight 0.15s",
        }}>{step.title}</span>
        <span style={{
          color: T.t4, fontSize: 12, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s ease",
        }}>▾</span>
      </button>

      {/* Body */}
      {open && (
        <div style={{ paddingLeft: 34, paddingBottom: 16, animation: "fadeUp 0.2s ease both" }}>
          <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.75, marginBottom: step.docs?.length ? 12 : 0 }}>
            {step.detail}
          </p>
          {step.docs && step.docs.length > 0 && (
            <div style={{
              marginTop: 2, padding: "10px 12px", borderRadius: 6,
              background: T.bgSubtle, border: `1px solid ${T.border}`,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t3, marginBottom: 8 }}>
                Documents needed
              </p>
              {step.docs.map((doc, di) => (
                <div key={di} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "3px 0" }}>
                  <span style={{
                    width: 14, height: 14, border: `1px solid ${T.borderMid}`, borderRadius: 3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: T.t3, flexShrink: 0, marginTop: 2,
                  }}>✓</span>
                  <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.5 }}>{doc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PathwaySection({ pathway }: { pathway: Pathway }) {
  return (
    <div>
      {/* Authority */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        padding: "12px 14px", borderRadius: 7,
        background: T.bgSubtle, border: `1px solid ${T.border}`,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🏛</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t3, marginBottom: 4 }}>
            Authority to approach
          </p>
          <p style={{ fontSize: 13, color: T.t1, lineHeight: 1.55 }}>{pathway.authority}</p>
        </div>
      </div>

      {/* Deadline */}
      <div style={{
        display: "flex", gap: 9, alignItems: "flex-start",
        padding: "11px 13px", borderRadius: 7,
        background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.18)",
        marginBottom: 20,
      }}>
        <span style={{ color: "#b45309", fontSize: 14, flexShrink: 0, marginTop: 1 }}>⏱</span>
        <p style={{ fontSize: 13, color: "#b45309", lineHeight: 1.6 }}>{pathway.deadlineNote}</p>
      </div>

      {/* Steps hint */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t4, marginBottom: 2 }}>
        Steps · tap each to expand
      </p>

      {/* Step rows */}
      <div>
        {pathway.steps.map((s, i) => (
          <PathwayStepRow key={i} step={s} i={i} total={pathway.steps.length} />
        ))}
      </div>
    </div>
  );
}

// ─── RAG debug (collapsed) ────────────────────────────────────────────────────

function tokenize(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2);
}

function RagPanel({ query, loading, ragDebug, state }: {
  query: string; loading: boolean; ragDebug: RagDebug | null; state: State;
}) {
  const [open, setOpen] = useState(false);
  const tokens = useMemo(() => tokenize(query), [query]);
  if (!tokens.length) return null;

  const selected = ragDebug?.allScored.filter(c => c.selected) ?? [];
  const maxScore = ragDebug ? Math.max(...ragDebug.allScored.map(c => c.score), 1) : 1;

  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 8,
      background: T.bgSubtle, overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
          borderBottom: open ? `1px solid ${T.border}` : "none",
        }}
      >
        <span style={{ fontSize: 11, color: T.t3 }}>⚙</span>
        <span style={{ fontSize: 11, color: T.t3 }}>Pipeline trace</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: T.t4 }}>
          {ragDebug
            ? `${selected.length} chunks retrieved · ${ragDebug.queryTokens.length} tokens`
            : loading ? "running…" : "—"}
        </span>
        <span style={{ fontSize: 10, color: T.t4, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: 14, animation: "fadeUp 0.2s ease both" }}>
          {/* Tokens */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t4, marginBottom: 6 }}>
            Query tokens
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
            {tokens.map((t, i) => (
              <span key={i} style={{
                fontSize: 11, padding: "2px 7px", borderRadius: 4,
                background: T.bgMuted, border: `1px solid ${T.border}`,
                color: T.t2,
              }}>{t}</span>
            ))}
          </div>

          {/* Chunk scores */}
          {ragDebug && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.t4, marginBottom: 8 }}>
                Chunk scores — {ragDebug.filteredByJurisdiction}/{ragDebug.totalInCorpus} in jurisdiction
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ragDebug.allScored.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 140, flexShrink: 0, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontSize: 10, color: c.selected ? T.t1 : T.t4,
                    }} title={`${c.act} — ${c.section}`}>
                      {c.act.slice(0, 20)}… {c.section}
                    </span>
                    <div style={{
                      flex: 1, height: 3, background: T.bgMuted, borderRadius: 2, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${(c.score / maxScore) * 100}%`,
                        background: c.selected ? T.accent : T.borderMid,
                        borderRadius: 2, opacity: c.selected ? 1 : 0.4,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                    <span style={{ width: 16, textAlign: "right", fontSize: 10, color: c.selected ? T.t1 : T.t4 }}>{c.score}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[280, 240, 200, 260, 180, 220].map((w, i) => (
        <div key={i} style={{
          height: 13, width: Math.min(w, 400), maxWidth: "100%",
          background: T.bgMuted, borderRadius: 4,
          animation: `pulse 1.4s ease-in-out ${i * 0.07}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useIsDesktop(breakpoint = 900) {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    setIs(mq.matches);
    const h = (e: MediaQueryListEvent) => setIs(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [breakpoint]);
  return is;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { theme, toggle } = useTheme();
  const isDesktop = useIsDesktop();
  const [state, setState] = useState<State>("TN");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    const q = query.trim();
    setLoading(true); setError(null); setResult(null); setSubmitted(q);
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const res = await fetch(`${apiUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, state }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "An unexpected error occurred.");
      } else {
        setResult(data);
        // On mobile scroll to results; on desktop the right pane auto-shows
        if (!isDesktop) {
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
        }
      }
    } catch {
      setError("Could not connect. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  const HEADER_H = 52;

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50, height: HEADER_H,
        background: T.bg, borderBottom: `1px solid ${T.border}`,
        transition: "background 0.15s ease",
        display: "flex", alignItems: "center",
      }}>
        <div style={{
          width: "100%", maxWidth: 1400,
          margin: "0 auto", padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>⚖</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.t1, letterSpacing: "-0.02em" }}>
              KnowYourRights
            </span>
          </div>
          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={toggle}
              suppressHydrationWarning
              aria-label="Toggle theme"
              style={{
                width: 32, height: 32, borderRadius: 6,
                border: `1px solid ${T.border}`, background: "none",
                cursor: "pointer", color: T.t2,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSubtle; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Two-pane layout ─────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        display: isDesktop ? "grid" : "block",
        gridTemplateColumns: isDesktop ? "420px 1fr" : undefined,
        minHeight: `calc(100vh - ${HEADER_H}px)`,
      }}>

        {/* ── LEFT PANE — form (sticky on desktop) ──────────────────────────── */}
        <div style={{
          padding: isDesktop ? "56px 40px 80px 32px" : "48px 24px 40px",
          borderRight: isDesktop ? `1px solid ${T.border}` : "none",
          borderBottom: !isDesktop ? `1px solid ${T.border}` : "none",
          // Sticky only on desktop so form stays visible while results scroll
          position: isDesktop ? "sticky" : "static",
          top: isDesktop ? HEADER_H : undefined,
          height: isDesktop ? `calc(100vh - ${HEADER_H}px)` : "auto",
          overflowY: isDesktop ? "auto" : undefined,
        }}>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{
              fontSize: isDesktop ? 36 : "clamp(28px, 7vw, 40px)",
              fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1,
              color: T.t1, marginBottom: 14,
            }}>
              Know your rights<br />as a worker in India.
            </h1>
            <p style={{ fontSize: 14, color: T.t3, lineHeight: 1.65, maxWidth: 340 }}>
              Pick your state, describe your situation, and get a cited answer
              grounded in real Indian legislation — not generic advice.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>

            {/* State selector */}
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: T.t3, marginBottom: 8,
              }}>Your state</p>
              <div style={{
                display: "flex",
                border: `1px solid ${T.border}`,
                borderRadius: 8, overflow: "hidden",
              }}>
                {(["TN", "MH", "KA"] as State[]).map((s, si) => (
                  <button
                    key={s} type="button"
                    id={`state-btn-${s}`}
                    onClick={() => setState(s)}
                    style={{
                      flex: 1, padding: "9px 0",
                      background: state === s ? T.accent : "none",
                      color: state === s ? T.accentFg : T.t2,
                      border: "none",
                      borderRight: si < 2 ? `1px solid ${T.border}` : "none",
                      cursor: "pointer",
                      fontSize: 13, fontWeight: state === s ? 600 : 400,
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {STATE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: T.t3, marginBottom: 8,
              }}>Your situation</p>
              <textarea
                id="situation-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Describe your work-related problem in plain language…"
                rows={5}
                onFocus={() => setTextareaFocused(true)}
                onBlur={() => setTextareaFocused(false)}
                style={{
                  width: "100%", padding: "12px 14px",
                  background: T.bg,
                  border: `1px solid ${textareaFocused ? T.borderMid : T.border}`,
                  borderRadius: 7, color: T.t1,
                  fontSize: 14, lineHeight: 1.6, resize: "vertical",
                  outline: "none", transition: "border-color 0.15s",
                }}
              />
              {/* Example chips */}
              <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i} type="button" onClick={() => setQuery(ex)}
                    style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 20,
                      border: `1px solid ${T.border}`, background: "none",
                      color: T.t3, cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = T.bgSubtle;
                      (e.currentTarget as HTMLButtonElement).style.color = T.t2;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                      (e.currentTarget as HTMLButtonElement).style.color = T.t3;
                    }}
                  >
                    {ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              id="submit-query-btn" type="submit"
              disabled={loading || !query.trim()}
              suppressHydrationWarning
              style={{
                width: "100%", padding: "11px 0",
                background: loading || !query.trim() ? T.bgMuted : T.accent,
                color: loading || !query.trim() ? T.t4 : T.accentFg,
                border: `1px solid ${loading || !query.trim() ? T.border : T.accent}`,
                borderRadius: 7, fontSize: 14, fontWeight: 500,
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, background 0.15s",
                letterSpacing: "-0.01em",
              }}
            >
              {loading ? "Searching legal provisions…" : "Get legal information →"}
            </button>
          </form>

          {/* RAG pipeline trace debug panel (enabled via NEXT_PUBLIC_SHOW_DEBUG=true) */}
          {process.env.NEXT_PUBLIC_SHOW_DEBUG === "true" && submitted && (
            <RagPanel query={submitted} loading={loading} ragDebug={result?.ragDebug ?? null} state={state} />
          )}

        </div>
        {/* ── RIGHT PANE — results ───────────────────────────────────────────── */}
        <div
          ref={resultsRef}
          style={{
            padding: isDesktop ? "56px 48px 80px 48px" : "40px 24px 80px",
            // On desktop, show a quiet placeholder when there's nothing yet
          }}
        >
          {/* Empty state */}
          {!loading && !result && !error && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: isDesktop ? "flex-start" : "center",
              justifyContent: isDesktop ? "flex-start" : "center",
              height: isDesktop ? "100%" : "auto",
              paddingTop: isDesktop ? 48 : 0,
              paddingBottom: isDesktop ? 0 : 32,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, marginBottom: 16, background: T.bgSubtle,
              }}>⚖</div>
              <p style={{ fontSize: 14, color: T.t3, lineHeight: 1.6, maxWidth: 320 }}>
                Your answer, cited sources, evidence assessment, and step-by-step action plan will appear here.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ animation: "fadeUp 0.25s ease both" }}>
              <p style={{ fontSize: 12, color: T.t4, marginBottom: 24, letterSpacing: "0.01em" }}>
                Retrieving provisions · generating answer…
              </p>
              <Skeleton />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              display: "flex", gap: 9, padding: "12px 14px", borderRadius: 7,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
              animation: "fadeUp 0.25s ease both",
            }}>
              <span style={{ color: "#dc2626", flexShrink: 0 }}>⚠</span>
              <p style={{ fontSize: 13, color: "#dc2626", lineHeight: 1.55 }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div style={{ animation: "fadeUp 0.3s ease both" }}>

              {/* Category + state tags */}
              <div style={{ display: "flex", gap: 5, marginBottom: 28, flexWrap: "wrap" }}>
                {result.detectedCategory && (
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "3px 10px",
                    border: `1px solid ${T.border}`, borderRadius: 20,
                    background: T.bgSubtle, color: T.t2,
                  }}>{result.detectedCategory.replace(/_/g, " ")}</span>
                )}
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: "3px 10px",
                  border: `1px solid ${T.border}`, borderRadius: 20,
                  background: T.bgSubtle, color: T.t2,
                }}>{STATE_LABELS[state]}</span>
              </div>

              {/* Answer */}
              <section style={{ marginBottom: 8 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: T.t4, marginBottom: 14,
                }}>⚖ Legal information</p>
                <div style={{
                  fontSize: 15, lineHeight: 1.8, color: T.t1,
                  whiteSpace: "pre-wrap",
                }}>{result.answer}</div>
              </section>

              <Divider />

              {/* Citations + Evidence (two-col on desktop right pane) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 8 }}>
                <section>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: T.t4, marginBottom: 4,
                  }}>§ Sources</p>
                  {result.citations.length > 0
                    ? result.citations.map((c, i) => (
                      <CitationRow key={i} c={c} i={i} total={result.citations.length} />
                    ))
                    : <p style={{ fontSize: 13, color: T.t3 }}>No citations returned.</p>
                  }
                </section>

                <section>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: T.t4, marginBottom: 14,
                  }}>◈ Evidence quality</p>
                  <EvidenceBlock ev={result.evidence} />
                  <p style={{ fontSize: 12, color: T.t4, marginTop: 14, lineHeight: 1.5 }}>
                    Reflects provisions retrieved — not a prediction of outcome.
                  </p>
                </section>
              </div>

              <Divider />

              {/* Pathway */}
              <section style={{ marginBottom: 8 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: T.t4, marginBottom: 18,
                }}>→ What to do next</p>
                <PathwaySection pathway={result.pathway} />
              </section>

              <Divider />

              {/* Disclaimer */}
              <p style={{ fontSize: 12, color: T.t4, lineHeight: 1.7 }}>
                <strong style={{ color: T.t3 }}>Disclaimer.</strong>{" "}
                This is legal information, not legal advice. For your specific situation, consult a qualified
                lawyer or visit your nearest District Legal Services Authority (DLSA) for free legal aid.
              </p>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
