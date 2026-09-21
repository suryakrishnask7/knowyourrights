"use client";

import React from "react";

interface EntryGateProps {
  userName: string;
  setUserName: (val: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  onContinue: () => void;
  buttonLabel?: string;
  compact?: boolean;
}

export default function EntryGate({
  userName,
  setUserName,
  termsAccepted,
  setTermsAccepted,
  onContinue,
  buttonLabel = "PROCEED TO INQUIRY",
  compact = false,
}: EntryGateProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) return;
    onContinue();
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${compact ? "space-y-4" : "space-y-6"}`}>
      {/* Optional Name Intake Field */}
      <div>
        <label
          htmlFor="kyr-user-name"
          className="block text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--text-3)] uppercase mb-2"
        >
          WHAT SHOULD WE CALL YOU?{" "}
          <span className="text-[10px] text-[var(--text-4)] font-normal tracking-normal">(OPTIONAL)</span>
        </label>
        <div className="w-full border border-[var(--border)] bg-[var(--bg-surface)] p-4 focus-within:border-[var(--text-1)] transition-colors">
          <input
            id="kyr-user-name"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Priya or Rahul"
            maxLength={50}
            className="w-full bg-transparent text-[var(--text-1)] text-base sm:text-lg placeholder:text-[var(--text-4)] focus:outline-none font-sans"
          />
        </div>
        <p className="text-[11px] text-[var(--text-3)] mt-2 font-sans">
          Used solely to address you and draft formal notices. Never shared or sold.
        </p>
      </div>

      {/* Statutory Terms & Legal Disclaimer Checkbox */}
      <div className="w-full border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
        <label className="flex items-start gap-3.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            id="kyr-terms-checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-none border border-[var(--border-strong)] bg-[var(--bg-surface)] accent-[var(--text-1)] cursor-pointer shrink-0"
          />
          <div className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed font-sans">
            <span className="text-[var(--text-1)] font-semibold block mb-1">
              Statutory Research & Non-Representation Acknowledgment
            </span>
            I understand that KnowYourRights provides statutory legal information and procedural guidance based on Indian law, not individualized legal advice or attorney representation. I agree to the terms of service and statutory research methodology.
          </div>
        </label>
      </div>

      {/* Continue Action */}
      <div>
        <button
          type="submit"
          disabled={!termsAccepted}
          className={`w-full py-4 px-6 text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase transition-all border ${
            termsAccepted
              ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] hover:opacity-90 cursor-pointer shadow-sm active:scale-[0.99]"
              : "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
          }`}
        >
          [ {buttonLabel} ]
        </button>
        {!termsAccepted && (
          <p className="text-[10px] font-mono text-[var(--text-4)] mt-2">
            * Check the statutory research acknowledgment above to proceed.
          </p>
        )}
      </div>
    </form>
  );
}
