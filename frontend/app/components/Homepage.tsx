"use client";

import React from "react";
import VectorRetrievalVisual from "./VectorRetrievalVisual";
import EntryGate from "./EntryGate";
import { UI_TRANSLATIONS } from "../translations";

interface HomepageProps {
  userName: string;
  setUserName: (val: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  onStartQuery: () => void;
  onOpenHowModal?: () => void;
  lang?: string;
}

export default function Homepage({
  userName,
  setUserName,
  termsAccepted,
  setTermsAccepted,
  onStartQuery,
  lang = "en",
}: HomepageProps) {
  const t = (UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en).homepage;

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
            <span className="text-[var(--accent-crimson)] font-bold">{t.systemBadge}</span>
            <span>·</span>
            <span>{t.archiveBadge}</span>
          </div>
          <div className="text-right">
            <span>{t.jurisdictionBadge}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase block">
                {t.heroKicker}
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-serif font-bold text-[var(--text-1)] leading-[1.15] tracking-tight">
                {t.heroTitle}
              </h1>
            </div>

            <p className="text-base sm:text-lg font-serif text-[var(--text-2)] leading-relaxed">
              {t.heroDesc}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToStart}
                className="py-3 px-6 text-xs sm:text-sm font-mono font-bold tracking-[0.15em] uppercase border border-[var(--text-1)] bg-[var(--text-1)] text-[var(--bg)] hover:opacity-90 transition-all cursor-pointer shadow-sm rounded-none"
              >
                {t.startInquiry}
              </button>
              <a
                href="#how-it-works"
                className="py-3 px-5 text-xs font-mono font-bold tracking-wider text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-2)] transition-all rounded-none"
              >
                {t.howItWorksBtn}
              </a>
            </div>

            <div className="pt-2 border-t border-[var(--border)] grid grid-cols-3 gap-4 font-mono text-[11px] text-[var(--text-3)]">
              <div>
                <span className="block font-bold text-[var(--text-1)] font-sans text-xs">{t.pillar1Title}</span>
                <span>{t.pillar1Sub}</span>
              </div>
              <div>
                <span className="block font-bold text-[var(--text-1)] font-sans text-xs">{t.pillar2Title}</span>
                <span>{t.pillar2Sub}</span>
              </div>
              <div>
                <span className="block font-bold text-[var(--text-1)] font-sans text-xs">{t.pillar3Title}</span>
                <span>{t.pillar3Sub}</span>
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
            {t.methodologyKicker}
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
            {t.methodologyTitle}
          </h2>
          <p className="text-sm sm:text-base font-serif text-[var(--text-2)] mt-2 leading-relaxed">
            {t.methodologyDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.stages.map((stage) => (
            <div key={stage.num} className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3 rounded-none">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-[var(--accent-crimson)]">{stage.num}</span>
                <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                  {stage.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-2)] font-sans leading-relaxed">
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Why It's Different ──────────────────────────────────── */}
      <section className="border-b border-[var(--border)] pb-14 sm:pb-20">
        <div className="max-w-2xl mb-10">
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase block mb-2">
            {t.rigorKicker}
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
            {t.rigorTitle}
          </h2>
          <p className="text-sm sm:text-base font-serif text-[var(--text-2)] mt-2 leading-relaxed">
            {t.rigorDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.rigorCards.map((card, i) => (
            <div key={i} className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between rounded-none">
              <div className="space-y-3">
                <div className="font-mono text-[10px] text-[var(--accent-crimson)] font-bold uppercase">
                  {card.kicker}
                </div>
                <h3 className="font-serif font-bold text-lg text-[var(--text-1)]">
                  {card.title}
                </h3>
                <p className="text-xs text-[var(--text-2)] leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[var(--border)] font-mono text-[10px] text-[var(--text-3)]">
                {card.footer}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Start Here (Entry Gate) ─────────────────────────────── */}
      <section id="start" className="scroll-mt-12 pb-16 w-full">
        <div className="border-t border-[var(--border)] pt-12 w-full">
          <div className="w-full mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[var(--accent-crimson)]">§ 5</span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">
                {t.entryKicker}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
              {t.entryTitle}
            </h2>
            <p className="text-sm sm:text-base font-serif text-[var(--text-2)] mt-2 leading-relaxed">
              {t.entryDesc}
            </p>
          </div>

          <div className="w-full">
            <EntryGate
              userName={userName}
              setUserName={setUserName}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              onContinue={onStartQuery}
              lang={lang}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
