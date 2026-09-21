"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Language = "python" | "javascript" | "sql" | "cpp" | "java" | "rust";

interface LanguageSpec {
  id: Language;
  name: string;
  badge: string;
  template: string;
}

const LANGUAGES: LanguageSpec[] = [
  {
    id: "python",
    name: "Python 3.10",
    badge: "PY 3.10",
    template: `# Python 3.10 — Engineering Workbench Sandbox

def process_data(records):
    print("Processing statutory records...")
    total = sum(r['amount'] for r in records if r['valid'])
    return {"status": "COMPLETE", "total_amount": total}

sample_data = [
    {"id": 101, "amount": 15000, "valid": True},
    {"id": 102, "amount": 22000, "valid": True},
    {"id": 103, "amount": 8000, "valid": False},
]

result = process_data(sample_data)
print(f"Result: {result}")
`,
  },
  {
    id: "sql",
    name: "SQL Engine (SQLite)",
    badge: "SQLITE 3",
    template: `-- SQL Query Sandbox (In-Memory Execution)

CREATE TABLE statutory_claims (
    claim_id INTEGER PRIMARY KEY,
    employee_name TEXT,
    jurisdiction TEXT,
    claimed_amount INT,
    status TEXT
);

INSERT INTO statutory_claims VALUES 
    (1, 'Aarav Sharma', 'TN', 45000, 'PENDING'),
    (2, 'Priya Nair', 'MH', 60000, 'RESOLVED'),
    (3, 'Karthik Raja', 'KA', 30000, 'IN_REVIEW');

SELECT * FROM statutory_claims WHERE claimed_amount >= 40000;
`,
  },
  {
    id: "javascript",
    name: "JavaScript (Node.js)",
    badge: "NODE.JS",
    template: `// JavaScript (Node.js) — Code Workbench

function calculateStatutorySeverance(yearsServed, monthlyBasicSalary) {
    if (yearsServed < 1) return 0;
    // 15 days of salary for every completed year of service
    const dailyWage = monthlyBasicSalary / 26;
    const severance = Math.round(15 * dailyWage * yearsServed);
    return severance;
}

const severancePay = calculateStatutorySeverance(4, 32000);
console.log("Calculated Severance Pay (Rs):", severancePay);
`,
  },
  {
    id: "cpp",
    name: "C++ (GCC)",
    badge: "C++ 17",
    template: `// C++ 17 — Code Workbench
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "KnowYourRights C++ Statutory Compiler" << std::endl;
    std::vector<int> wage_months = {28000, 30000, 30000, 32000};
    int total = std::accumulate(wage_months.begin(), wage_months.end(), 0);
    std::cout << "Total Wages Processed: Rs " << total << std::endl;
    return 0;
}
`,
  },
  {
    id: "java",
    name: "Java 17",
    badge: "JAVA 17",
    template: `// Java 17 — Code Workbench
public class solution {
    public static void main(String[] args) {
        System.out.println("Java Statutory Audit Runner");
        int salary = 40000;
        int monthsUnpaid = 3;
        System.out.println("Total Statutory Liability: Rs " + (salary * monthsUnpaid));
    }
}
`,
  },
  {
    id: "rust",
    name: "Rust",
    badge: "RUST 1.70",
    template: `// Rust — Code Workbench
fn main() {
    println!("Statutory Compliance Checker (Rust)");
    let years_worked = 5;
    let eligible = years_worked >= 5;
    println!("Gratuity Eligibility (>= 5 years): {}", eligible);
}
`,
  },
];

interface ExecutionResult {
  status: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

export default function EngineeringPage() {
  const [selectedLang, setSelectedLang] = useState<Language>("python");
  const [code, setCode] = useState<string>(LANGUAGES[0].template);
  const [stdinInput, setStdinInput] = useState<string>("");
  const [showStdin, setShowStdin] = useState<boolean>(false);
  
  const [running, setRunning] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const activeAbortController = useRef<AbortController | null>(null);

  // Switch language template
  const handleLangChange = (langId: Language) => {
    setSelectedLang(langId);
    const spec = LANGUAGES.find(l => l.id === langId);
    if (spec) {
      setCode(spec.template);
    }
    setOutput(null);
    setErrorMsg(null);
  };

  // Handle Rate Limiting Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle TAB key in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Gracefully Run Code with AbortController and Rate Limiting Protection
  const handleRunCode = useCallback(async () => {
    if (running || cooldown > 0 || !code.trim()) return;

    // Abort previous in-flight request if present
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const abortCtrl = new AbortController();
    activeAbortController.current = abortCtrl;

    setRunning(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          language: selectedLang,
          code: code,
          stdin: stdinInput,
          client_id: "workbench-user",
        }),
      });

      const data: ExecutionResult = await res.json();
      if (!res.ok) {
        setErrorMsg((data as unknown as { detail?: string }).detail ?? "Execution request failed.");
      } else {
        setOutput(data);
        if (data.status === "rate_limited") {
          setCooldown(2.0);
        } else {
          setCooldown(1.5); // 1.5 second cooldown between runs to protect server
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg("Failed to communicate with execution server. Check FastAPI backend connection.");
    } finally {
      setRunning(false);
    }
  }, [running, cooldown, code, selectedLang, stdinInput]);

  const lineCount = code.split("\n").length;
  const currentSpec = LANGUAGES.find(l => l.id === selectedLang) ?? LANGUAGES[0];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] font-sans antialiased py-8 px-4 sm:px-8 md:px-12">
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Full-width Editorial Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border)] font-sans">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-xl sm:text-2xl">⚙</span>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl tracking-wider uppercase text-[var(--text-1)] block leading-none">
                KNOWYOURRIGHTS
              </span>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[var(--text-3)] uppercase block mt-1">
                ENGINEERING WORKBENCH & COMPILER
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link href="/" className="border border-[var(--border)] px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-[var(--text-1)] transition-colors">
              ← STATUTORY ARCHIVE
            </Link>
          </div>
        </header>

        {/* Workbench Hero Banner */}
        <main className="py-6 animate-fade-up">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--accent-crimson)] uppercase">
                  MULTI-LANGUAGE EXECUTION ENVIRONMENT
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--text-1)]">
                Engineering Code Workbench
              </h1>
            </div>

            {/* Language Selection Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs font-bold">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLangChange(lang.id)}
                  className={`px-3 py-1.5 border transition-all ${
                    selectedLang === lang.id
                      ? "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)]"
                      : "bg-[var(--bg-surface)] text-[var(--text-3)] border-[var(--border)] hover:border-[var(--text-1)] hover:text-[var(--text-1)]"
                  }`}
                >
                  {lang.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Workbench Grid Layout: Left Code Editor | Right Terminal Output */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Columns: Interactive Code Editor */}
            <div className="lg:col-span-7 border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
              
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between p-3.5 border-b border-[var(--border)] bg-[var(--bg-subtle)] font-mono text-xs text-[var(--text-3)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-crimson)] inline-block" />
                  <span className="font-bold text-[var(--text-1)]">{currentSpec.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{lineCount} LINES</span>
                  <span>·</span>
                  <span>{code.length} CHARS</span>
                  <button
                    onClick={() => setCode(currentSpec.template)}
                    className="hover:text-[var(--text-1)] underline decoration-dotted"
                  >
                    [ RESET TEMPLATE ]
                  </button>
                </div>
              </div>

              {/* Code Textarea Area with Line Numbers */}
              <div className="relative flex min-h-[420px] font-mono text-sm">
                {/* Line Numbers */}
                <div className="w-12 py-4 select-none bg-[var(--bg-subtle)] text-right pr-3 text-[var(--text-4)] border-r border-[var(--border)] font-mono text-xs leading-relaxed">
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Main Code Input */}
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  rows={20}
                  className="flex-1 p-4 bg-transparent text-[var(--text-1)] font-mono text-sm leading-relaxed focus:outline-none resize-none"
                  placeholder="Write your code here..."
                />
              </div>

              {/* STDIN Input Accordion Drawer */}
              <div className="border-t border-[var(--border)] p-3 bg-[var(--bg-subtle)] font-mono text-xs">
                <button
                  onClick={() => setShowStdin(!showStdin)}
                  className="flex items-center justify-between w-full text-[var(--text-2)] hover:text-[var(--text-1)] font-bold"
                >
                  <span>STANDARD INPUT (STDIN) {stdinInput ? "• HAS INPUT" : ""}</span>
                  <span>{showStdin ? "HIDE [-]" : "EXPAND [+]"}</span>
                </button>
                {showStdin && (
                  <textarea
                    value={stdinInput}
                    onChange={e => setStdinInput(e.target.value)}
                    placeholder="Enter input values for your program..."
                    rows={3}
                    className="w-full mt-2.5 p-3 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-1)] focus:outline-none text-xs"
                  />
                )}
              </div>

              {/* Editor Action Toolbar */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--text-3)] text-[11px]">
                  {cooldown > 0 ? `COOLDOWN: ${cooldown.toFixed(1)}s` : "READY FOR EXECUTION"}
                </span>

                <button
                  onClick={handleRunCode}
                  disabled={running || cooldown > 0 || !code.trim()}
                  className={`px-6 py-3 font-bold tracking-wider uppercase transition-all border ${
                    running || cooldown > 0 || !code.trim()
                      ? "bg-[var(--bg-subtle)] text-[var(--text-4)] border-[var(--border)] cursor-not-allowed"
                      : "bg-[var(--text-1)] text-[var(--bg)] border-[var(--text-1)] hover:opacity-90 cursor-pointer shadow-sm"
                  }`}
                >
                  {running ? "[ EXECUTING... ]" : cooldown > 0 ? `[ WAIT ${cooldown.toFixed(1)}s ]` : "[ ▶ RUN CODE ]"}
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Live Terminal & Output Display */}
            <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm font-mono">
              
              {/* Terminal Header */}
              <div className="p-3.5 border-b border-[var(--border)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-1)] tracking-wider">EXECUTION TERMINAL</span>
                {output && (
                  <button
                    onClick={() => setOutput(null)}
                    className="text-[var(--text-3)] hover:text-[var(--text-1)]"
                  >
                    [ CLEAR ]
                  </button>
                )}
              </div>

              <div className="p-5 min-h-[460px] flex flex-col justify-between">
                
                {errorMsg && (
                  <div className="p-4 bg-[var(--bg-subtle)] border-l-2 border-[var(--accent-crimson)] text-[var(--accent-crimson)] text-xs mb-4">
                    [SERVER ERROR] {errorMsg}
                  </div>
                )}

                {/* Output Contents */}
                {!output && !running && !errorMsg && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--text-3)] border border-dashed border-[var(--border)]">
                    <span className="text-3xl mb-3">💻</span>
                    <p className="text-xs font-serif italic text-[var(--text-2)] mb-1">
                      No execution output yet.
                    </p>
                    <p className="text-[11px]">
                      Select language, write code, and click <span className="font-bold text-[var(--text-1)]">[ ▶ RUN CODE ]</span> to view stdout & compilation metrics.
                    </p>
                  </div>
                )}

                {running && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-up">
                    <span className="w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-ping mb-4" />
                    <p className="text-xs font-bold text-[var(--text-1)] uppercase tracking-wider">
                      Executing Code in Sandbox...
                    </p>
                    <p className="text-[11px] text-[var(--text-3)] mt-1">
                      Enforcing 5s timeout & rate limit bounds
                    </p>
                  </div>
                )}

                {output && !running && (
                  <div className="space-y-4 flex-1 animate-fade-up">
                    
                    {/* Execution Metrics Bar */}
                    <div className="flex items-center justify-between border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 font-bold uppercase text-[10px] ${
                          output.status === "success"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}>
                          {output.status.toUpperCase()}
                        </span>
                        <span className="text-[var(--text-2)]">EXIT CODE: {output.exitCode}</span>
                      </div>
                      <span className="text-[var(--text-3)] font-bold">
                        ⏱ {output.executionTimeMs} ms
                      </span>
                    </div>

                    {/* Standard Output stdout */}
                    {output.stdout && (
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1.5">
                          STDOUT (STANDARD OUTPUT)
                        </p>
                        <pre className="p-4 border border-[var(--border)] bg-[var(--bg-subtle)] text-xs text-[var(--text-1)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {output.stdout}
                        </pre>
                      </div>
                    )}

                    {/* Standard Error stderr */}
                    {output.stderr && (
                      <div>
                        <p className="text-[10px] font-bold text-[var(--accent-crimson)] uppercase tracking-wider mb-1.5">
                          STDERR / COMPILER DIAGNOSTICS
                        </p>
                        <pre className="p-4 border border-[var(--accent-crimson)] bg-[var(--bg-subtle)] text-xs text-[var(--accent-crimson)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {output.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Footer Info */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] text-[10px] text-[var(--text-3)] flex items-center justify-between">
                  <span>SANDBOX LIMIT: 5.0s MAX</span>
                  <span>CONCURRENCY: CAP 3</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
