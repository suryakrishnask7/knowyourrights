import { NextRequest, NextResponse } from "next/server";
import {
  retrieveChunks,
  callClaude,
  evidenceSufficiency,
  getPathway,
  askClarifyingQuestion,
} from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, state } = body as { query: string; state: "TN" | "MH" | "KA" };

    if (!query || typeof query !== "string" || query.trim().length < 5) {
      return NextResponse.json(
        { error: "Query must be at least 5 characters." },
        { status: 400 }
      );
    }

    if (!["TN", "MH", "KA"].includes(state)) {
      return NextResponse.json(
        { error: "State must be one of: TN, MH, KA." },
        { status: 400 }
      );
    }

    // 1. Retrieve relevant chunks (keyword overlap, jurisdiction-filtered)
    const chunks = retrieveChunks(query.trim(), state);

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          answer:
            "I wasn't able to find specific legal provisions matching your situation in the current corpus. This system currently covers unpaid wages, wrongful termination, and POSH complaints. Please rephrase your question or describe your situation differently.",
          citations: [],
          evidence: {
            level: "Low",
            reasons: ["No relevant provisions found in the corpus for this query."],
          },
          pathway: getPathway(null),
          detectedCategory: null,
        },
        { status: 200 }
      );
    }

    // 2. Call Claude with the retrieved chunks
    const claudeOutput = await callClaude(query.trim(), state, chunks);

    // 3. Evidence sufficiency (pure function, no API call)
    const evidence = evidenceSufficiency(
      chunks,
      claudeOutput.missingFacts ?? [],
      state,
      claudeOutput.detectedCategory
    );

    // 4. Clarifying question stub (always returns null in Phase 1)
    askClarifyingQuestion(evidence, claudeOutput.detectedCategory);

    // 5. Get procedural pathway
    const pathway = getPathway(claudeOutput.detectedCategory);

    return NextResponse.json({
      answer: claudeOutput.answer,
      citations: claudeOutput.citations,
      evidence,
      pathway,
      detectedCategory: claudeOutput.detectedCategory,
    });
  } catch (err) {
    console.error("[/api/query] Error:", err);

    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    return NextResponse.json(
      { error: `Failed to process query: ${message}` },
      { status: 500 }
    );
  }
}
