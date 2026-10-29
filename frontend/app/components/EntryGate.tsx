"use client";

import React from "react";
import { UI_TRANSLATIONS } from "../translations";

interface EntryGateProps {
  userName: string;
  setUserName: (val: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  onContinue: () => void;
  buttonLabel?: string;
  compact?: boolean;
  lang?: string;
}

export default function EntryGate({
  userName,
  setUserName,
  termsAccepted,
  setTermsAccepted,
  onContinue,
  buttonLabel,
  compact = false,
  lang = "en",
}: EntryGateProps) {
  const isReady = termsAccepted && userName.trim().length > 0;
  const t = (UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en).entryGate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    onContinue();
  };

  const finalButtonLabel = buttonLabel || t.proceedBtn;

  return (
    <form onSubmit={handleSubmit} className={`w-full ${compact ? "space-y-4" : "space-y-6"}`}>
      {/* Name Intake Field */}
      <div>
        <label
          htmlFor="kyr-user-name"
          className="block text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-2"
        >
          {t.nameLabel}
        </label>
        <input
          id="kyr-user-name"
          type="text"
          suppressHydrationWarning
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          maxLength={50}
          className="w-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--text-1)] text-base focus:outline-none focus:border-[var(--text-1)] font-sans transition-colors rounded-none"
        />
        <p className="text-[11px] text-[var(--text-3)] mt-1.5 font-sans">
          {t.nameHint}
        </p>
      </div>

      {/* Statutory Terms & Legal Disclaimer Checkbox */}
      <div className="w-full border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 rounded-none">
        <label className="flex items-start gap-3.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            id="kyr-terms-checkbox"
            suppressHydrationWarning
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-none border border-[var(--border-strong)] bg-[var(--bg-surface)] accent-[var(--text-1)] cursor-pointer shrink-0"
          />
          <div className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed font-sans">
            <span className="text-[var(--text-1)] font-semibold block mb-1">
              {t.termsHeading}
            </span>
            {t.termsText}
          </div>
        </label>
      </div>

      {/* Continue Action */}
      <div>
        <button
          type="submit"
          suppressHydrationWarning
          disabled={!isReady}
          className={`w-full py-4 px-6 text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase transition-all border rounded-none ${
            isReady
              ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] hover:opacity-90 cursor-pointer shadow-sm active:scale-[0.99]"
              : "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
          }`}
        >
          [ {finalButtonLabel} ]
        </button>
        {!termsAccepted && (
          <p className="text-[10px] font-mono text-[var(--text-4)] mt-2">
            {t.termsWarning}
          </p>
        )}
      </div>
    </form>
  );
}
