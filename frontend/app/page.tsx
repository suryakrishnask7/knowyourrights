"use client";

import { useState, useRef } from "react";

// ─── Types (mirrors API response shape) ──────────────────────────────────────

type Citation = { act: string; section: string; jurisdiction: string };
type Evidence = { level: "High" | "Medium" | "Low"; reasons: string[] };
type Pathway = { authority: string; deadlineNote: string; steps: string[] };

type QueryResult = {
  answer: string;
  citations: Citation[];
  evidence: Evidence;
  pathway: Pathway;
  detectedCategory: string | null;
  error?: string;
};

type State = "TN" | "MH" | "KA";

const STATE_LABELS: Record<State, string> = {
  TN: "Tamil Nadu",
  MH: "Maharashtra",
  KA: "Karnataka",
};

const EXAMPLE_QUERIES = [
  "My employer hasn't paid my salary for the last two months. What can I do?",
  "I was fired without any notice or reason. Is this legal?",
  "My manager has been making inappropriate comments. How do I file a POSH complaint?",
];

// ─── Evidence Badge ───────────────────────────────────────────────────────────

function EvidenceBadge({ evidence }: { evidence: Evidence }) {
  const config = {
    High:   { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: "●" },
    Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "◐" },
    Low:    { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",  border: "rgba(244,63,94,0.3)",  icon: "○" },
  }[evidence.level];

  return (
    <div style={{ border: `1px solid ${config.border}`, background: config.bg, borderRadius: 12, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ color: config.color, fontSize: 18 }}>{config.icon}</span>
        <span style={{ color: config.color, fontWeight: 700, fontSize: 15, letterSpacing: "0.04em" }}>
          {evidence.level.toUpperCase()} EVIDENCE
        </span>
      </div>
      <ul style={{ paddingLeft: 16, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {evidence.reasons.map((r, i) => (
          <li key={i} style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── Citation Card ────────────────────────────────────────────────────────────

function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  const isState = citation.jurisdiction !== "central";
  const label = isState ? STATE_LABELS[citation.jurisdiction as State] ?? citation.jurisdiction : "Central Law";

  return (
    <div style={{
      background: "rgba(22, 43, 85, 0.6)",
      border: "1px solid rgba(212,175,55,0.15)",
      borderRadius: 10,
      padding: "12px 16px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <span style={{
        minWidth: 24, height: 24, borderRadius: 6,
        background: "rgba(212,175,55,0.15)",
        color: "#d4af37", fontSize: 12, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{index + 1}</span>
      <div>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{citation.act}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{
            background: "rgba(212,175,55,0.12)", color: "#d4af37",
            border: "1px solid rgba(212,175,55,0.25)", borderRadius: 4,
            padding: "2px 8px", fontSize: 11, fontWeight: 600,
          }}>{citation.section}</span>
          <span style={{
            background: isState ? "rgba(99,102,241,0.12)" : "rgba(148,163,184,0.1)",
            color: isState ? "#a5b4fc" : "#94a3b8",
            border: `1px solid ${isState ? "rgba(99,102,241,0.25)" : "rgba(148,163,184,0.2)"}`,
            borderRadius: 4, padding: "2px 8px", fontSize: 11,
          }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <span style={{ color: "#94a3b8", fontSize: 14 }}>Searching legal provisions and generating your answer…</span>
      </div>
      {[120, 80, 100, 60, 80].map((h, i) => (
        <div key={i} className="shimmer" style={{ height: h, width: i % 2 === 0 ? "100%" : "75%" }} />
      ))}
    </div>
  );
}

// ─── Pathway Steps ────────────────────────────────────────────────────────────

function PathwaySection({ pathway }: { pathway: Pathway }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          Authority to approach
        </div>
        <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{pathway.authority}</div>
      </div>
      <div style={{
        background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)",
        borderRadius: 8, padding: "10px 14px", marginBottom: 16,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ color: "#d4af37", fontSize: 16, marginTop: 1 }}>⏱</span>
        <span style={{ color: "#d4af37", fontSize: 13, lineHeight: 1.5 }}>{pathway.deadlineNote}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pathway.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              minWidth: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))",
              border: "1px solid rgba(212,175,55,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#d4af37", fontSize: 12, fontWeight: 700,
            }}>{i + 1}</div>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<State>("TN");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), state }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "An unexpected error occurred. Please try again.");
      } else {
        setResult(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch {
      setError("Could not connect to the server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Animated gradient background */}
      <div className="animated-bg" />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {/* ── Header ── */}
        <header style={{
          borderBottom: "1px solid rgba(212,175,55,0.1)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(6,13,31,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg, #d4af37, #9a7a1a)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>⚖</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "#f1f5f9" }}>
                Know<span className="gold-text">Your</span>Rights
              </div>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.06em" }}>
                INDIAN LABOUR LAW GUIDE
              </div>
            </div>
          </div>
          <div style={{
            fontSize: 12, color: "#64748b",
            background: "rgba(15,32,64,0.6)",
            border: "1px solid rgba(100,116,139,0.2)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            Phase 1 · 3 scenarios · TN / MH / KA
          </div>
        </header>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: "#f1f5f9",
              marginBottom: 16,
            }}>
              Know your rights as a<br />
              <span className="gold-text">worker in India.</span>
            </h1>
            <p style={{ color: "#64748b", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Pick your state, describe your situation, and get a cited answer grounded
              in real Indian labour legislation — not generic advice.
            </p>
          </div>

          {/* ── Query Form ── */}
          <div className="glass-card" style={{ padding: "32px", marginBottom: 40 }}>
            <form onSubmit={handleSubmit}>
              {/* State selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: "#94a3b8", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 10,
                }}>
                  Your State
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["TN", "MH", "KA"] as State[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      id={`state-btn-${s}`}
                      onClick={() => setState(s)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10,
                        fontWeight: 600, fontSize: 14, cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: state === s
                          ? "1px solid rgba(212,175,55,0.5)"
                          : "1px solid rgba(148,163,184,0.15)",
                        background: state === s
                          ? "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))"
                          : "rgba(15,32,64,0.4)",
                        color: state === s ? "#d4af37" : "#64748b",
                      }}
                    >
                      {STATE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="situation-input"
                  style={{
                    display: "block", fontSize: 12, fontWeight: 600,
                    color: "#94a3b8", textTransform: "uppercase",
                    letterSpacing: "0.08em", marginBottom: 10,
                  }}
                >
                  Your Situation
                </label>
                <textarea
                  id="situation-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your work-related problem in plain language…"
                  rows={4}
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: "rgba(6,13,31,0.7)",
                    border: "1px solid rgba(148,163,184,0.15)",
                    borderRadius: 10, color: "#e2e8f0",
                    fontSize: 15, lineHeight: 1.6,
                    resize: "vertical", outline: "none",
                    fontFamily: "var(--font-inter)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(148,163,184,0.15)")}
                />
                {/* Example queries */}
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {EXAMPLE_QUERIES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuery(ex)}
                      style={{
                        fontSize: 11, color: "#64748b",
                        background: "rgba(15,32,64,0.5)",
                        border: "1px solid rgba(148,163,184,0.1)",
                        borderRadius: 20, padding: "4px 10px",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.color = "#94a3b8";
                        (e.target as HTMLButtonElement).style.borderColor = "rgba(148,163,184,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.color = "#64748b";
                        (e.target as HTMLButtonElement).style.borderColor = "rgba(148,163,184,0.1)";
                      }}
                    >
                      {ex.substring(0, 42)}…
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                id="submit-query-btn"
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  width: "100%", padding: "14px 0",
                  background: loading || !query.trim()
                    ? "rgba(212,175,55,0.2)"
                    : "linear-gradient(135deg, #c9a227, #9a7a1a)",
                  color: loading || !query.trim() ? "rgba(212,175,55,0.4)" : "#fff",
                  border: "none", borderRadius: 10,
                  fontWeight: 700, fontSize: 15, cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? "Searching legal provisions…" : "Get Legal Information →"}
              </button>
            </form>
          </div>

          {/* ── Results ── */}
          <div ref={resultsRef}>
            {loading && (
              <div className="glass-card" style={{ padding: 32 }}>
                <LoadingSkeleton />
              </div>
            )}

            {error && !loading && (
              <div className="fade-in" style={{
                background: "rgba(244,63,94,0.07)",
                border: "1px solid rgba(244,63,94,0.25)",
                borderRadius: 16, padding: "20px 24px",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: "#f43f5e" }}>⚠</span>
                  <span style={{ color: "#f43f5e", fontWeight: 600, fontSize: 14 }}>Error</span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Category pill */}
                {result.detectedCategory && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Category detected:</span>
                    <span style={{
                      background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600,
                    }}>
                      {result.detectedCategory.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>·</span>
                    <span style={{
                      background: "rgba(212,175,55,0.1)", color: "#d4af37",
                      border: "1px solid rgba(212,175,55,0.25)",
                      borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600,
                    }}>
                      {STATE_LABELS[state]}
                    </span>
                  </div>
                )}

                {/* Answer */}
                <div className="glass-card" style={{ padding: "28px 32px" }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#64748b",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: "#d4af37" }}>⚖</span> Legal Information
                  </div>
                  <div style={{
                    color: "#e2e8f0", fontSize: 15, lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}>
                    {result.answer}
                  </div>
                </div>

                {/* Citations + Evidence side by side on wide screens */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Citations */}
                  <div className="glass-card" style={{ padding: "24px 28px" }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: "#d4af37" }}>§</span> Legal Sources
                    </div>
                    {result.citations.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {result.citations.map((c, i) => (
                          <CitationCard key={i} citation={c} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#64748b", fontSize: 13 }}>No specific citations provided.</p>
                    )}
                  </div>

                  {/* Evidence */}
                  <div className="glass-card" style={{ padding: "24px 28px" }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: "#d4af37" }}>◈</span> Evidence Quality
                    </div>
                    <EvidenceBadge evidence={result.evidence} />
                    <p style={{ color: "#475569", fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
                      This label reflects the breadth of legal provisions retrieved for your query — not a prediction of case outcome.
                    </p>
                  </div>
                </div>

                {/* Pathway */}
                <div className="glass-card" style={{ padding: "28px 32px" }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#64748b",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: "#d4af37" }}>→</span> What To Do Next
                  </div>
                  <PathwaySection pathway={result.pathway} />
                </div>

                {/* Disclaimer */}
                <div style={{
                  background: "rgba(15,32,64,0.4)",
                  border: "1px solid rgba(148,163,184,0.08)",
                  borderRadius: 10, padding: "14px 18px",
                }}>
                  <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
                    <strong style={{ color: "#64748b" }}>Disclaimer:</strong> This is legal information, not legal advice.
                    For your specific situation, consult a qualified lawyer or approach your nearest District Legal Services Authority (DLSA) for free legal aid.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
