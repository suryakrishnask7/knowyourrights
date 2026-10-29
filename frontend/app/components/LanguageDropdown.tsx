"use client";

import { useState, useRef, useEffect } from "react";

export interface LanguageOption {
  code: string;
  label: string;
  name: string;
}

interface LanguageDropdownProps {
  selectedLanguage: string;
  isTranslating: boolean;
  onSelectLanguage: (code: string) => void;
  languages?: LanguageOption[];
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "EN", name: "English" },
  { code: "ta", label: "தமிழ்", name: "Tamil" },
  { code: "hi", label: "हिन्दी", name: "Hindi" },
  { code: "kn", label: "ಕನ್ನಡ", name: "Kannada" },
  { code: "mr", label: "मराठी", name: "Marathi" },
  { code: "te", label: "తెలుగు", name: "Telugu" },
];

export default function LanguageDropdown({
  selectedLanguage,
  isTranslating,
  onSelectLanguage,
  languages = DEFAULT_LANGUAGES,
}: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const current = languages.find((l) => l.code === selectedLanguage) || languages[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Sharp Rectangular Docket Trigger Button */}
      <button
        type="button"
        disabled={isTranslating}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select Language"
        className={`group relative flex items-center gap-2 px-3 py-1.5 border text-xs font-mono rounded-none select-none transition-colors ${
          isOpen
            ? "border-[var(--text-1)] bg-[var(--bg-subtle)] text-[var(--text-1)]"
            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-1)] hover:bg-[var(--bg-subtle)] text-[var(--text-1)]"
        } ${isTranslating ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
      >
        <span className="text-xs text-[var(--text-3)] group-hover:text-[var(--text-1)] select-none">🌐</span>

        <span className="font-bold tracking-wide text-[var(--text-1)]">
          {current.label}
        </span>
        <span className="text-[10px] text-[var(--text-3)] font-mono hidden sm:inline">
          · {current.name}
        </span>

        {isTranslating ? (
          <span className="inline-block w-1.5 h-1.5 bg-[var(--accent-crimson)] animate-ping ml-1" />
        ) : (
          <span className={`text-[9px] text-[var(--text-3)] group-hover:text-[var(--text-1)] transition-transform duration-150 ml-1 ${isOpen ? "rotate-180 inline-block" : "inline-block"}`}>
            ▼
          </span>
        )}
      </button>

      {/* Sharp Rectangular Docket Flyout Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1 w-64 border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl p-1 z-50 rounded-none animate-fade-up font-mono"
        >
          {/* Docket Header */}
          <div className="px-2.5 py-1.5 mb-1 border-b border-[var(--border)] flex items-center justify-between text-[9px] text-[var(--text-3)] uppercase tracking-[0.2em] font-bold">
            <span>JURISDICTION LANGUAGE</span>
            <span>[{languages.length}]</span>
          </div>

          {/* Language Options */}
          <div className="space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (!isSelected) {
                      onSelectLanguage(lang.code);
                    }
                  }}
                  className={`group flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-none transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[var(--bg-subtle)] text-[var(--text-1)] font-bold border-l-2 border-[var(--accent-crimson)] pl-2"
                      : "text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] border-l-2 border-transparent"
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[13px] ${
                        isSelected
                          ? "text-[var(--text-1)] font-bold"
                          : "text-[var(--text-2)] group-hover:text-[var(--text-1)]"
                      }`}
                    >
                      {lang.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-3)]">
                      ({lang.name})
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-xs font-bold text-[var(--text-1)]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Docket Footer */}
          <div className="mt-1 pt-1.5 px-2 border-t border-[var(--border)] flex items-center justify-between text-[9px] text-[var(--text-4)] uppercase tracking-wider">
            <span>STATUTORY ENGINE</span>
            <span className="text-[var(--text-3)]">READY</span>
          </div>
        </div>
      )}
    </div>
  );
}
