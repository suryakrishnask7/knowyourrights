"use client";

import { useState, useRef, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Citation = { act: string; section: string; jurisdiction: string };
type Evidence = { level: "High" | "Medium" | "Low"; reasons: string[] };
type Pathway = { authority: string; deadlineNote: string; steps: string[] };

type ScoredChunkDebug = {
  act: string;
  section: string;
  jurisdiction: string;
  category: string;
  score: number;
  keywordMatches: string[];
  textMatches: string[];
  textPreview: string;
  selected: boolean;
};

type RagDebug = {
  queryTokens: string[];
  totalInCorpus: number;
  filteredByJurisdiction: number;
  allScored: ScoredChunkDebug[];
};

type QueryResult = {
  answer: string;
  citations: Citation[];
  evidence: Evidence;
  pathway: Pathway;
  detectedCategory: string | null;
  ragDebug?: RagDebug;
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

// ─── Client-side tokenizer (mirrors server-side tokenize()) ──────────────────

function tokenizeQuery(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

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
      background: "rgba(22,43,85,0.6)", border: "1px solid rgba(212,175,55,0.15)",
      borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{
        minWidth: 24, height: 24, borderRadius: 6, background: "rgba(212,175,55,0.15)",
        color: "#d4af37", fontSize: 12, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{index + 1}</span>
      <div>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{citation.act}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{
            background: "rgba(212,175,55,0.12)", color: "#d4af37",
            border: "1px solid rgba(212,175,55,0.25)", borderRadius: 4, padding: "2px 8px",
            fontSize: 11, fontWeight: 600,
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
        <span style={{ color: "#94a3b8", fontSize: 14 }}>Generating answer from retrieved provisions…</span>
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
              background: "linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))",
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

// ─── RAG Pipeline Panel helpers ───────────────────────────────────────────────

function StepBadge({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      background: done
        ? "linear-gradient(135deg,#d4af37,#9a7a1a)"
        : active ? "rgba(212,175,55,0.15)" : "rgba(71,85,105,0.15)",
      border: done ? "none" : "1px solid rgba(212,175,55,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800,
      color: done ? "#fff" : "#94a3b8",
      transition: "all 0.4s ease",
    }}>
      {done ? "✓" : n}
    </div>
  );
}

function ScanLine({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div className="shimmer" style={{ height: 6, width: "55%", borderRadius: 4 }} />
      <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
    </div>
  );
}

function HighlightedText({ text, tokens }: { text: string; tokens: string[] }) {
  const words = text.split(/(\s+)/);
  return (
    <p style={{
      fontSize: 12, lineHeight: 1.7, color: "#64748b",
      fontFamily: "monospace", wordBreak: "break-word",
    }}>
      {words.map((word, i) => {
        const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        const matched = cleaned.length > 2 && tokens.some(
          (t) => cleaned.includes(t) || t.includes(cleaned)
        );
        return (
          <span key={i} style={
            matched
              ? { color: "#93c5fd", background: "rgba(99,102,241,0.12)", borderRadius: 2, padding: "0 2px" }
              : {}
          }>{word}</span>
        );
      })}
      <span style={{ color: "#334155" }}> …</span>
    </p>
  );
}

// ─── RAG Pipeline Panel ───────────────────────────────────────────────────────

function RagPipelinePanel({
  query, loading, ragDebug, state,
}: {
  query: string;
  loading: boolean;
  ragDebug: RagDebug | null;
  state: State;
}) {
  const tokens = useMemo(() => tokenizeQuery(query), [query]);

  // Map each query token to its best match type across all scored chunks
  const tokenMatchType = useMemo((): Record<string, "keyword" | "text" | "none"> => {
    if (!ragDebug) return {};
    const res: Record<string, "keyword" | "text" | "none"> = {};
    for (const token of tokens) {
      const hasKeyword = ragDebug.allScored.some((c) =>
        c.keywordMatches.some(
          (km) => token.includes(km.toLowerCase()) || km.toLowerCase().includes(token)
        )
      );
      const hasText = ragDebug.allScored.some((c) => c.textMatches.includes(token));
      res[token] = hasKeyword ? "keyword" : hasText ? "text" : "none";
    }
    return res;
  }, [ragDebug, tokens]);

  const maxScore = ragDebug
    ? Math.max(...ragDebug.allScored.map((c) => c.score), 1)
    : 1;

  if (tokens.length === 0) return null;

  const selectedChunks = ragDebug?.allScored.filter((c) => c.selected) ?? [];
  const notSelectedCount = (ragDebug?.allScored.length ?? 0) - selectedChunks.length;

  return (
    <div
      className="fade-in"
      style={{
        background: "rgba(5,10,28,0.9)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        paddingBottom: 18, marginBottom: 24,
        borderBottom: "1px solid rgba(99,102,241,0.12)",
      }}>
        <span style={{ fontSize: 18 }}>⚙</span>
        <span style={{ fontWeight: 800, fontSize: 13, color: "#c7d2fe", letterSpacing: "0.07em" }}>
          RAG PIPELINE TRACE
        </span>
        <span style={{ color: "#2d3f5f", fontSize: 13 }}>·</span>
        <span style={{ fontSize: 11, color: "#475569" }}>
          keyword retrieval · no embedding vectors · Phase 1
        </span>
        {loading && !ragDebug && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="pulse-dot" style={{ width: 5, height: 5, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}
        {ragDebug && (
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "#10b981",
            border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20,
            padding: "2px 10px", background: "rgba(16,185,129,0.06)",
          }}>● complete</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {/* ── Step 1: Tokenization ── */}
        <div className="rag-step" style={{ animationDelay: "0s", paddingBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <StepBadge n={1} done active={false} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#d4af37" }}>
              Query Tokenization
            </span>
            <code style={{
              fontSize: 10, color: "#475569",
              background: "rgba(71,85,105,0.1)", border: "1px solid rgba(71,85,105,0.15)",
              borderRadius: 4, padding: "1px 7px",
            }}>
              lower → strip punct → split → len &gt; 2
            </code>
          </div>

          {/* Token chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {tokens.map((token, i) => {
              const mt = tokenMatchType[token] ?? "none";
              const c = {
                keyword: { bg: "rgba(212,175,55,0.18)", color: "#d4af37",  border: "rgba(212,175,55,0.35)" },
                text:    { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc",  border: "rgba(99,102,241,0.3)"  },
                none:    { bg: "rgba(71,85,105,0.1)",  color: "#475569",  border: "rgba(71,85,105,0.18)"  },
              }[mt];
              return (
                <span
                  key={i}
                  className="rag-token"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    background: c.bg, color: c.color,
                    border: `1px solid ${c.border}`,
                    borderRadius: 20, padding: "4px 14px",
                    fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                  }}
                >
                  {token}
                </span>
              );
            })}
          </div>

          {/* Legend — only after debug is available */}
          {ragDebug && (
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {([
                { color: "#d4af37", label: "keyword match (×2 weight)" },
                { color: "#a5b4fc", label: "text match (×1 weight)" },
                { color: "#475569", label: "no match" },
              ] as const).map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vertical connector */}
        <div style={{ width: 1, height: 24, background: "rgba(99,102,241,0.15)", marginLeft: 12, marginBottom: 0 }} />

        {/* ── Step 2: Corpus Filter ── */}
        <div className="rag-step" style={{ animationDelay: "0.12s", paddingBottom: 24, paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <StepBadge n={2} done={!!ragDebug} active={loading && !ragDebug} />
            <span style={{ fontWeight: 700, fontSize: 13, color: ragDebug ? "#d4af37" : "#64748b" }}>
              Corpus Filter
            </span>
            <span style={{ fontSize: 11, color: "#334155" }}>
              → jurisdiction ∈ &#123;{state}, central&#125;
            </span>
          </div>
          {loading && !ragDebug ? (
            <ScanLine label="scanning legal corpus…" />
          ) : ragDebug ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 8, background: "rgba(71,85,105,0.15)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    className="rag-bar-grow"
                    style={{
                      height: "100%",
                      width: `${(ragDebug.filteredByJurisdiction / ragDebug.totalInCorpus) * 100}%`,
                      background: "linear-gradient(90deg, #6366f1, #818cf8)",
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "#818cf8", whiteSpace: "nowrap", fontWeight: 600 }}>
                  {ragDebug.filteredByJurisdiction} / {ragDebug.totalInCorpus} eligible
                </span>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#475569" }}>
                  Total corpus: <span style={{ color: "#64748b" }}>{ragDebug.totalInCorpus}</span>
                </span>
                <span style={{ fontSize: 11, color: "#475569" }}>
                  After filter: <span style={{ color: "#818cf8" }}>{ragDebug.filteredByJurisdiction}</span>
                </span>
                <span style={{ fontSize: 11, color: "#475569" }}>
                  Score &gt; 0: <span style={{ color: "#d4af37" }}>{ragDebug.allScored.length}</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Vertical connector */}
        <div style={{ width: 1, height: 24, background: "rgba(99,102,241,0.15)", marginLeft: 12 }} />

        {/* ── Step 3: Chunk Scoring ── */}
        <div className="rag-step" style={{ animationDelay: "0.24s", paddingBottom: 24, paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <StepBadge n={3} done={!!ragDebug} active={loading && !ragDebug} />
            <span style={{ fontWeight: 700, fontSize: 13, color: ragDebug ? "#d4af37" : "#64748b" }}>
              Chunk Scoring
            </span>
            <code style={{
              fontSize: 11, color: "#94a3b8",
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 4, padding: "1px 8px",
            }}>
              score = keyword_hits × 2 + text_hits
            </code>
          </div>

          {loading && !ragDebug ? (
            <ScanLine label="scoring by keyword overlap…" />
          ) : ragDebug && ragDebug.allScored.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {ragDebug.allScored.map((chunk, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Act label */}
                  <div
                    title={`${chunk.act} — ${chunk.section}`}
                    style={{
                      width: 200, flexShrink: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: 11, color: chunk.selected ? "#d4af37" : "#475569" }}>
                      {chunk.act.length > 24 ? chunk.act.slice(0, 24) + "…" : chunk.act}
                    </span>
                    <span style={{ fontSize: 10, color: "#2d3f5f", marginLeft: 4 }}>{chunk.section}</span>
                  </div>

                  {/* Score bar */}
                  <div style={{
                    flex: 1, height: 22, background: "rgba(71,85,105,0.1)",
                    borderRadius: 4, overflow: "hidden", position: "relative",
                  }}>
                    <div
                      className="rag-bar-grow"
                      style={{
                        height: "100%",
                        width: `${(chunk.score / maxScore) * 100}%`,
                        background: chunk.selected
                          ? "linear-gradient(90deg, rgba(212,175,55,0.75), rgba(212,175,55,0.3))"
                          : "rgba(51,65,85,0.45)",
                        borderRadius: 4,
                        animationDelay: `${i * 0.04}s`,
                      }}
                    />
                    {/* Breakdown label inside bar */}
                    {chunk.selected && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, height: "100%",
                        display: "flex", alignItems: "center", paddingLeft: 8,
                        fontSize: 10, color: "rgba(212,175,55,0.75)", pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}>
                        {chunk.keywordMatches.length > 0 && `${chunk.keywordMatches.length} kw×2`}
                        {chunk.keywordMatches.length > 0 && chunk.textMatches.length > 0 && " + "}
                        {chunk.textMatches.length > 0 && `${chunk.textMatches.length} txt`}
                      </div>
                    )}
                  </div>

                  {/* Numeric score */}
                  <span style={{
                    fontSize: 13, fontWeight: 800, fontFamily: "monospace",
                    color: chunk.selected ? "#d4af37" : "#334155",
                    width: 24, textAlign: "right",
                  }}>{chunk.score}</span>

                  {/* Retrieved badge */}
                  {chunk.selected ? (
                    <span style={{
                      fontSize: 10, color: "#d4af37",
                      border: "1px solid rgba(212,175,55,0.3)", borderRadius: 4,
                      padding: "1px 6px", background: "rgba(212,175,55,0.08)",
                      whiteSpace: "nowrap",
                    }}>↑ top-k</span>
                  ) : (
                    <span style={{ width: 48, flexShrink: 0 }} />
                  )}
                </div>
              ))}
              {notSelectedCount > 0 && (
                <div style={{ fontSize: 11, color: "#2d3f5f", marginTop: 4 }}>
                  {notSelectedCount} chunk{notSelectedCount > 1 ? "s" : ""} scored &gt;0 but below top-4 cutoff
                </div>
              )}
            </div>
          ) : ragDebug ? (
            <span style={{ fontSize: 12, color: "#475569" }}>No chunks scored above 0 for this query.</span>
          ) : null}
        </div>

        {/* Vertical connector */}
        <div style={{ width: 1, height: 24, background: "rgba(99,102,241,0.15)", marginLeft: 12 }} />

        {/* ── Step 4: Retrieved Chunks → LLM ── */}
        <div className="rag-step" style={{ animationDelay: "0.36s", paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <StepBadge n={4} done={!!ragDebug} active={loading} />
            <span style={{ fontWeight: 700, fontSize: 13, color: ragDebug ? "#d4af37" : "#64748b" }}>
              {loading && !ragDebug
                ? "Sending to LLM…"
                : `Top ${selectedChunks.length} Chunks → llama-3.3-70b-versatile`}
            </span>
          </div>

          {loading && !ragDebug ? (
            <ScanLine label="waiting for Groq response…" />
          ) : ragDebug && selectedChunks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>
                {selectedChunks.length} chunks injected as context ·{" "}
                <span style={{ color: "#818cf8" }}>highlighted text</span> = query token matches
              </div>
              {selectedChunks.map((chunk, i) => (
                <div
                  key={i}
                  className="rag-token"
                  style={{
                    animationDelay: `${i * 0.12}s`,
                    background: "rgba(8,14,36,0.95)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 10, padding: "14px 18px",
                  }}
                >
                  {/* Chunk header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{
                      background: "linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))",
                      color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: 6, padding: "2px 10px", fontSize: 10,
                      fontWeight: 800, fontFamily: "monospace",
                    }}>
                      score {chunk.score}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#e2e8f0" }}>{chunk.act}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{chunk.section}</span>
                    <span style={{
                      marginLeft: "auto", fontSize: 10, color: "#64748b",
                      border: "1px solid rgba(100,116,139,0.2)",
                      borderRadius: 20, padding: "1px 8px",
                    }}>
                      {chunk.jurisdiction === "central"
                        ? "Central"
                        : STATE_LABELS[chunk.jurisdiction as State] ?? chunk.jurisdiction}
                    </span>
                  </div>

                  {/* Text with highlights */}
                  <HighlightedText text={chunk.textPreview} tokens={ragDebug.queryTokens} />

                  {/* Keyword hits */}
                  {chunk.keywordMatches.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#334155" }}>keyword hits:</span>
                      {chunk.keywordMatches.map((kw, ki) => (
                        <span key={ki} style={{
                          fontSize: 10, color: "#d4af37",
                          background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)",
                          borderRadius: 4, padding: "1px 8px",
                        }}>{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<State>("TN");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const q = query.trim();
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmittedQuery(q);

    // Scroll to pipeline immediately so user sees it animate
    setTimeout(() => pipelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, state }),
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
          padding: "20px 32px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          background: "rgba(6,13,31,0.8)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg,#d4af37,#9a7a1a)",
              borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18,
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
            background: "rgba(15,32,64,0.6)", border: "1px solid rgba(100,116,139,0.2)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            Phase 1 · 3 scenarios · TN / MH / KA
          </div>
        </header>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{
              fontSize: "clamp(28px,5vw,48px)", fontWeight: 800,
              letterSpacing: "-0.03em", lineHeight: 1.15,
              color: "#f1f5f9", marginBottom: 16,
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
          <div className="glass-card" style={{ padding: "32px", marginBottom: 32 }}>
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
                      key={s} type="button" id={`state-btn-${s}`}
                      onClick={() => setState(s)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10,
                        fontWeight: 600, fontSize: 14, cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: state === s
                          ? "1px solid rgba(212,175,55,0.5)"
                          : "1px solid rgba(148,163,184,0.15)",
                        background: state === s
                          ? "linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))"
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
                    fontSize: 15, lineHeight: 1.6, resize: "vertical",
                    outline: "none", fontFamily: "var(--font-inter)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(148,163,184,0.15)")}
                />
                {/* Example queries */}
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {EXAMPLE_QUERIES.map((ex, i) => (
                    <button
                      key={i} type="button" onClick={() => setQuery(ex)}
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
                    : "linear-gradient(135deg,#c9a227,#9a7a1a)",
                  color: loading || !query.trim() ? "rgba(212,175,55,0.4)" : "#fff",
                  border: "none", borderRadius: 10,
                  fontWeight: 700, fontSize: 15,
                  cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease", letterSpacing: "0.02em",
                }}
              >
                {loading ? "Retrieving & generating…" : "Get Legal Information →"}
              </button>
            </form>
          </div>

          {/* ── RAG Pipeline Panel ── */}
          <div ref={pipelineRef}>
            {(loading || result) && submittedQuery && (
              <RagPipelinePanel
                query={submittedQuery}
                loading={loading}
                ragDebug={result?.ragDebug ?? null}
                state={state}
              />
            )}
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
                  <div style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {result.answer}
                  </div>
                </div>

                {/* Citations + Evidence */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                      This label reflects the breadth of legal provisions retrieved — not a prediction of case outcome.
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
                    For your specific situation, consult a qualified lawyer or approach your nearest
                    District Legal Services Authority (DLSA) for free legal aid.
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
