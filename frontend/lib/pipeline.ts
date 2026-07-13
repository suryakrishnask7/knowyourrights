/**
 * lib/pipeline.ts — The five named pipeline functions for Phase 1.
 *
 * These functions have the same signatures they'd have if CORPUS were a database
 * query. Phase 2 replaces the internals of retrieveChunks() without touching
 * anything that calls it.
 */

import Groq from "groq-sdk";
import { CORPUS, PATHWAYS, type Chunk, type Category } from "./corpus";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Citation = {
  act: string;
  section: string;
  jurisdiction: string;
};

export type EvidenceResult = {
  level: "High" | "Medium" | "Low";
  reasons: string[];
};

export type PathwayResult = {
  authority: string;
  deadlineNote: string;
  steps: string[];
};

export type QueryResponse = {
  answer: string;
  citations: Citation[];
  evidence: EvidenceResult;
  pathway: PathwayResult;
  detectedCategory: string | null;
};

export type ScoredChunk = Chunk & { score: number };

export type ScoredChunkDebug = {
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

export type RagDebug = {
  queryTokens: string[];
  totalInCorpus: number;
  filteredByJurisdiction: number;
  allScored: ScoredChunkDebug[];
};

// ─── 1. retrieveChunks ────────────────────────────────────────────────────────

/**
 * Filter the corpus to the relevant jurisdiction and rank by keyword overlap.
 *
 * EXTENSION POINT (Phase 2): Replace the body of this function with a
 * pgvector cosine-similarity query. The caller signature stays identical.
 */
export function retrieveChunks(
  query: string,
  state: "TN" | "MH" | "KA",
  k = 4
): ScoredChunk[] {
  const queryTokens = tokenize(query);

  const candidates = CORPUS.filter(
    (c) => c.jurisdiction === "central" || c.jurisdiction === state
  );

  const scored: ScoredChunk[] = candidates.map((chunk) => {
    const keywordHits = chunk.keywords.filter((kw) =>
      queryTokens.some((qt) => qt.includes(kw.toLowerCase()) || kw.toLowerCase().includes(qt))
    ).length;

    const textTokens = tokenize(chunk.text);
    const textHits = queryTokens.filter((qt) =>
      textTokens.some((tt) => tt.includes(qt) || qt.includes(tt))
    ).length;

    const score = keywordHits * 2 + textHits;
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

// ─── 1b. retrieveChunksWithDebug ─────────────────────────────────────────────

/**
 * Same as retrieveChunks but also returns a full RagDebug trace:
 * which tokens were extracted, how many corpus chunks were eligible,
 * and every chunk's individual keyword + text match breakdown.
 */
export function retrieveChunksWithDebug(
  query: string,
  state: "TN" | "MH" | "KA",
  k = 4
): { chunks: ScoredChunk[]; ragDebug: RagDebug } {
  const queryTokens = tokenize(query);

  const candidates = CORPUS.filter(
    (c) => c.jurisdiction === "central" || c.jurisdiction === state
  );

  const withScores = candidates
    .map((chunk) => {
      const textTokens = tokenize(chunk.text);

      const kwMatches = chunk.keywords.filter((kw) =>
        queryTokens.some(
          (qt) => qt.includes(kw.toLowerCase()) || kw.toLowerCase().includes(qt)
        )
      );
      const txtMatches = queryTokens.filter((qt) =>
        textTokens.some((tt) => tt.includes(qt) || qt.includes(tt))
      );

      const score = kwMatches.length * 2 + txtMatches.length;
      return { chunk, score, kwMatches, txtMatches };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const topK = withScores.slice(0, k);
  const topKIds = new Set(topK.map((x) => `${x.chunk.act}|${x.chunk.section}`));

  const allScored: ScoredChunkDebug[] = withScores.map(({ chunk, score, kwMatches, txtMatches }) => ({
    act: chunk.act,
    section: chunk.section,
    jurisdiction: chunk.jurisdiction,
    category: chunk.category,
    score,
    keywordMatches: kwMatches,
    textMatches: txtMatches,
    textPreview: chunk.text.slice(0, 200),
    selected: topKIds.has(`${chunk.act}|${chunk.section}`),
  }));

  return {
    chunks: topK.map((x) => ({ ...x.chunk, score: x.score })),
    ragDebug: {
      queryTokens,
      totalInCorpus: CORPUS.length,
      filteredByJurisdiction: candidates.length,
      allScored,
    },
  };
}

// ─── 2. callGroq ─────────────────────────────────────────────────────────────

type GroqOutput = {
  answer: string;
  citations: Citation[];
  missingFacts: string[];
  detectedCategory: Category | null;
};

/**
 * One Groq API call. Returns strict JSON parsed into GroqOutput.
 * Instructs the model to answer ONLY from the provided chunks and cite
 * every factual claim with act + section.
 */
export async function callGroq(
  query: string,
  state: string,
  chunks: ScoredChunk[]
): Promise<GroqOutput> {
  const stateNames: Record<string, string> = {
    TN: "Tamil Nadu",
    MH: "Maharashtra",
    KA: "Karnataka",
  };

  const chunkContext = chunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.act} — ${c.section} (${c.jurisdiction === "central" ? "Central Law" : stateNames[c.jurisdiction] ?? c.jurisdiction})\n${c.text}`
    )
    .join("\n\n");

  const systemPrompt = `You are a legal information assistant specialising in Indian labour law. You provide accurate, grounded information to workers about their legal rights.

CRITICAL RULES:
1. Answer ONLY using the legal provisions provided in the context below. Do not add facts, case law, or provisions not present in the context.
2. Cite the exact Act name and Section number for every factual claim you make.
3. Be specific, practical, and plain-language. Workers need to understand what to do.
4. If the context does not have enough information to fully answer the question, say so clearly and list what is missing in missingFacts.
5. Return your response as valid JSON matching this exact schema:

{
  "answer": "Your full plain-language answer here (2-4 paragraphs)",
  "citations": [
    { "act": "Act Name", "section": "Section X", "jurisdiction": "central | TN | MH | KA" }
  ],
  "missingFacts": ["fact 1 that would help", "fact 2"],
  "detectedCategory": "unpaid_wages | wrongful_termination | posh_complaint | null"
}

Do not include markdown, code fences, or any text outside the JSON object.`;

  const userMessage = `The worker is in ${stateNames[state] ?? state}.

Their situation:
"${query}"

Relevant legal provisions:
${chunkContext}

Answer based only on the provisions above.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });

  const rawText = response.choices[0]?.message?.content ?? "";

  // Strip any accidental markdown fences the model might add
  const jsonText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(jsonText) as GroqOutput;
  return parsed;
}

/** Backward-compat alias so existing callers don't need to change. */
export const callClaude = callGroq;

// ─── 3. evidenceSufficiency ───────────────────────────────────────────────────

/**
 * Pure function — no API call. Determines evidence level from:
 *   - Number and quality of retrieved chunks
 *   - Whether a state-specific chunk was found (for wrongful_termination)
 *   - Whether missingFacts is empty
 */
export function evidenceSufficiency(
  chunks: ScoredChunk[],
  missingFacts: string[],
  state: string,
  detectedCategory: string | null
): EvidenceResult {
  const reasons: string[] = [];

  const topScore = chunks[0]?.score ?? 0;
  const hasStateChunk = chunks.some((c) => c.jurisdiction === state);
  const hasMissingFacts = missingFacts.length > 0;
  const chunkCount = chunks.length;

  // Score components
  let points = 0;

  if (chunkCount >= 3) {
    points += 2;
    reasons.push(`${chunkCount} relevant provisions retrieved.`);
  } else if (chunkCount >= 1) {
    points += 1;
    reasons.push(`${chunkCount} relevant provision(s) retrieved.`);
  } else {
    reasons.push("No directly relevant provisions found for this query.");
  }

  if (topScore >= 4) {
    points += 2;
    reasons.push("Strong keyword match with retrieved provisions.");
  } else if (topScore >= 2) {
    points += 1;
    reasons.push("Moderate keyword match with retrieved provisions.");
  }

  if (detectedCategory === "wrongful_termination" || chunks.some((c) => c.category === "wrongful_termination")) {
    if (hasStateChunk) {
      points += 2;
      reasons.push(`State-specific provision for ${state} retrieved — answer is jurisdiction-specific.`);
    } else {
      points -= 1;
      reasons.push(`No ${state}-specific provision found; answer relies on central law only.`);
    }
  }

  if (!hasMissingFacts) {
    points += 1;
    reasons.push("No additional facts needed to answer this question.");
  } else {
    points -= 1;
    reasons.push(`Missing information: ${missingFacts.join("; ")}.`);
  }

  let level: "High" | "Medium" | "Low";
  if (points >= 5) {
    level = "High";
  } else if (points >= 2) {
    level = "Medium";
  } else {
    level = "Low";
  }

  return { level, reasons };
}

// ─── 4. getPathway ────────────────────────────────────────────────────────────

/**
 * Deterministic lookup of the procedural pathway for a given category.
 * Returns a fallback if the category is unknown.
 */
export function getPathway(category: string | null): PathwayResult {
  if (!category || !(category in PATHWAYS)) {
    // Best-effort: if category is partially recognisable, fuzzy-match
    const key = Object.keys(PATHWAYS).find((k) =>
      k.includes(category ?? "") || (category ?? "").includes(k)
    );
    if (key) return PATHWAYS[key];

    return {
      authority: "Labour Commissioner / District Legal Services Authority",
      deadlineNote: "Deadlines vary by category. Consult a legal aid clinic promptly.",
      steps: [
        "Document all relevant facts and communications in writing.",
        "Consult the nearest Legal Services Authority (free legal aid) for guidance.",
        "Contact the Labour Commissioner's office for the applicable procedure.",
      ],
    };
  }
  return PATHWAYS[category];
}

// ─── EXTENSION POINT STUB ─────────────────────────────────────────────────────

/**
 * askClarifyingQuestion — stub for the future clarification loop (Phase 2+).
 * Always returns null in Phase 1. When the loop is built, it slots between
 * evidenceSufficiency and getPathway without restructuring the pipeline.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function askClarifyingQuestion(
  _evidence: EvidenceResult,
  _category: string | null
): string | null {
  return null;
}
