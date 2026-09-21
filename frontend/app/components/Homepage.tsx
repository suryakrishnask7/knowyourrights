"use client";

import React from "react";
import VectorRetrievalVisual from "./VectorRetrievalVisual";
import EntryGate from "./EntryGate";

interface HomepageProps {
  userName: string;
  setUserName: (val: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  onStartQuery: () => void;
  onOpenHowModal?: () => void;
}

export default function Homepage({
  userName,
  setUserName,
  termsAccepted,
  setTermsAccepted,
  onStartQuery,
}: HomepageProps) {
  const scrollToStart = () => {
    const el = document.getElementById("start");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8 font-sans">
      {/* ── Gazette-Style Editorial Masthead & Hero Section ──────────────── */}
      <section className="border-b border-[var(--border)] pb-12 sm:pb-16">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-8 font-mono text-[10px] sm:text-xs text-[var(--text-3)] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-crimson)] font-bold">● STATUTORY INFORMATION SYSTEM</span>
            <span>·</span>
            <span>MINISTRY OF LABOUR & HOUSING ARCHIVE</span>
          </div>
          <div className="text-right">
            <span>JURISDICTION: TN · MH · KA · CENTRAL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase block">
                STATUTORY RIGHTS FOR WORKERS & TENANTS
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-serif font-bold text-[var(--text-1)] leading-[1.15] tracking-tight">
                Plain-language legal clarity grounded in Indian statute.
              </h1>
            </div>

            <p className="text-base sm:text-lg font-serif text-[var(--text-2)] leading-relaxed">
              Workers and tenants across India have enforceable rights under Central codes and State enactments, but the protections are buried under archaic legalese and fragmented state rules. KnowYourRights cuts through the opacity: matching your grievance to verified Indian law, honestly evaluating evidence sufficiency, and outlining your concrete procedural pathway.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToStart}
                className="py-3 px-6 text-xs sm:text-sm font-mono font-bold tracking-[0.15em] uppercase border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                [ START INQUIRY ]
              </button>
              <a
                href="#how-it-works"
                className="py-3 px-5 text-xs font-mono font-bold tracking-wider text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-2)] transition-all"
              >
                HOW IT WORKS ↓
              </a>
            </div>

            <div className="pt-2 border-t border-[var(--border)] grid grid-cols-3 gap-4 font-mono text-[11px] text-[var(--text-3)]">
              <div>
                <span className="block font-bold text-[var(--text-1)] font-sans text-xs">CENTRAL & STATE</span>
                <span>Jurisdiction-specific</span>
              </div>
              <div>
                <span className="block font-bold text-[var(--text-1)] font-sans text-xs">EVIDENCE-HONEST</span>
                <span>Precondition checks</span>
              </div>
              <div>
                <span className="block font-bold text-[var(--text-1)] font-sans text-xs">OFFICIAL NOTICES</span>
                <span>Statutory drafting</span>
              </div>
            </div>
          </div>

          {/* Hero The One Animated Moment: Vector Space Retrieval Visual */}
          <div className="lg:col-span-5">
            <VectorRetrievalVisual />
          </div>
        </div>
      </section>

      {/* ── Section: How It Works (The Pipeline for Real People) ─────────── */}
      <section id="how-it-works" className="border-b border-[var(--border)] pb-14 sm:pb-20 scroll-mt-12">
        <div className="max-w-2xl mb-10">
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase block mb-2">
            METHODOLOGY & REASONING
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
            How KnowYourRights evaluates your situation
          </h2>
          <p className="text-sm sm:text-base font-serif text-[var(--text-2)] mt-2 leading-relaxed">
            Legal problems are not abstract puzzles. We translate everyday disputes into verifiable statutory positions through a structured four-stage evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-[var(--accent-crimson)]">§ 1</span>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                Plain-Language Grievance Intake
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-2)] font-sans leading-relaxed">
              Describe what occurred in plain everyday words — whether your salary was withheld, PF deductions were never deposited to EPFO, you were dismissed without notice, or your landlord refuses to refund a security deposit. You do not need to know statutory terms or legal jargon.
            </p>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-[var(--accent-crimson)]">§ 2</span>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                Jurisdiction-Aware Statutory Search
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-2)] font-sans leading-relaxed">
              In India, labour and tenancy fall under concurrent legislative jurisdiction. The system identifies applicable Central enactments (such as the Payment of Wages Act or Industrial Disputes Act) and combines them with state-specific laws for Tamil Nadu, Maharashtra, or Karnataka.
            </p>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-[var(--accent-crimson)]">§ 3</span>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                Evidence Sufficiency & Targeted Clarification
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-2)] font-sans leading-relaxed">
              Instead of guessing or delivering overconfident claims, the system objectively tests whether essential statutory preconditions are met (such as continuous service tenure or wage limits). If critical facts are missing, it asks targeted clarifying questions before advising.
            </p>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-[var(--accent-crimson)]">§ 4</span>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                Actionable Procedural Recourse & Notice Drafting
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-2)] font-sans leading-relaxed">
              Rights without procedural remedies are ineffective. You receive the designated judicial authority (Labour Commissioner, Rent Controller, or DLSA), statutory limitation periods, evidentiary documents needed, and an automated formal legal notice ready for delivery.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section: Why It's Different ──────────────────────────────────── */}
      <section className="border-b border-[var(--border)] pb-14 sm:pb-20">
        <div className="max-w-2xl mb-10">
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase block mb-2">
            INSTITUTIONAL RIGOR
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
            Built for statutory accuracy, not conversational guesswork
          </h2>
          <p className="text-sm sm:text-base font-serif text-[var(--text-2)] mt-2 leading-relaxed">
            Generic conversational AI regularly hallucinates legal citations and provides inaccurate advice. KnowYourRights is architected with strict statutory safeguards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-[var(--accent-crimson)] font-bold uppercase">
                [ CITATION FIDELITY ]
              </div>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                Grounded in Verified Statute
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Every conclusion cites actual enactments, sections, and schedules from the Indian statutory archive. We never invent nonexistent provisions or cite fictitious case precedents.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[var(--border)] font-mono text-[10px] text-[var(--text-3)]">
              E.g. Payment of Wages Act § 15(2)
            </div>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-[var(--accent-crimson)] font-bold uppercase">
                [ EVIDENCE INTEGRITY ]
              </div>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                Honest About Uncertainty
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                If statutory preconditions are unverified, our Evidence Sufficiency engine explicitly assigns a Low or Medium confidence score and highlights missing facts rather than guessing.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[var(--border)] font-mono text-[10px] text-[var(--text-3)]">
              Evaluation: High · Medium · Low
            </div>
          </div>

          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-[var(--accent-crimson)] font-bold uppercase">
                [ CONFLICT OF LAWS ]
              </div>
              <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                State Jurisdiction Aware
              </h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Under Article 254 of the Indian Constitution, State laws modify Central labour frameworks. A tenancy claim in Bengaluru adheres to Karnataka law, not Tamil Nadu or Maharashtra rules.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[var(--border)] font-mono text-[10px] text-[var(--text-3)]">
              Resolves: Central vs State Precedence
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Start Here (Entry Gate) ─────────────────────────────── */}
      <section id="start" className="scroll-mt-12 pb-16">
        <div className="border-t border-[var(--border)] pt-12">
          <div className="max-w-3xl mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[var(--accent-crimson)]">§ 5</span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">
                ENTRY OF INQUIRY & ACKNOWLEDGEMENT
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
              Begin your legal inquiry
            </h2>
            <p className="text-sm sm:text-base font-serif text-[var(--text-2)] mt-2 leading-relaxed">
              Provide your name (optional) and acknowledge statutory terms to enter the query workspace.
            </p>
          </div>

          <div className="w-full">
            <EntryGate
              userName={userName}
              setUserName={setUserName}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              onContinue={onStartQuery}
              buttonLabel="CONTINUE TO INQUIRY"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
