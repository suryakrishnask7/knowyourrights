"use client";

import { useEffect, useState, useRef } from "react";

interface Node {
  id: string;
  act: string;
  section: string;
  jurisdiction: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMatch?: boolean;
}

const STATUTORY_PROVISIONS: Node[] = [
  { id: "pwa15", act: "Payment of Wages Act", section: "§ 15", jurisdiction: "Central", x: 280, y: 130, targetX: 280, targetY: 130, isMatch: true },
  { id: "cow13", act: "Code on Wages", section: "§ 13", jurisdiction: "Central", x: 340, y: 220, targetX: 340, targetY: 220, isMatch: true },
  { id: "ida25", act: "Industrial Disputes Act", section: "§ 25F", jurisdiction: "Central", x: 120, y: 90, targetX: 120, targetY: 90 },
  { id: "mta20", act: "Model Tenancy Act", section: "§ 20", jurisdiction: "State/UT", x: 440, y: 110, targetX: 440, targetY: 110 },
  { id: "tnshops", act: "TN Shops & Est. Act", section: "§ 41", jurisdiction: "Tamil Nadu", x: 210, y: 270, targetX: 210, targetY: 270 },
  { id: "posh9", act: "POSH Act", section: "§ 9", jurisdiction: "Central", x: 490, y: 240, targetX: 490, targetY: 240 },
  { id: "karent", act: "Karnataka Rent Act", section: "§ 27", jurisdiction: "Karnataka", x: 90, y: 230, targetX: 90, targetY: 230 },
];

export default function VectorRetrievalVisual() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % 1000);
    }, 40);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Query vector coordinates drifting slightly in motion
  const queryX = reducedMotion ? 295 : 295 + Math.sin(phase * 0.03) * 6;
  const queryY = reducedMotion ? 180 : 180 + Math.cos(phase * 0.025) * 5;

  return (
    <div
      ref={canvasRef}
      className="relative w-full border border-[var(--border)] bg-[#0d0d0f] p-4 sm:p-6 select-none overflow-hidden"
      aria-label="Abstract statutory retrieval visualization representing coordinate vector points connecting to verified Indian laws"
    >
      {/* Editorial docket stamp & coordinate header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3 font-mono text-[10px] text-[var(--text-3)] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent-crimson)] font-bold">● RETRIEVAL SPACE</span>
          <span>·</span>
          <span>EMBEDDING PROJECTION</span>
        </div>
        <div className="text-right">
          <span>JURISDICTION: TN · MH · KA · CENTRAL</span>
        </div>
      </div>

      <svg
        viewBox="0 0 580 340"
        className="w-full h-auto max-h-[340px] block font-mono"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="queryGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--text-1)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--text-1)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="matchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background coordinate grid lines */}
        <g stroke="#222228" strokeWidth="1" strokeDasharray="2 4">
          <line x1="60" y1="40" x2="520" y2="40" />
          <line x1="60" y1="120" x2="520" y2="120" />
          <line x1="60" y1="200" x2="520" y2="200" />
          <line x1="60" y1="280" x2="520" y2="280" />
          <line x1="140" y1="20" x2="140" y2="310" />
          <line x1="280" y1="20" x2="280" y2="310" />
          <line x1="420" y1="20" x2="420" y2="310" />
        </g>

        {/* Connecting vector rays to matching provisions */}
        <line
          x1={queryX}
          y1={queryY}
          x2={STATUTORY_PROVISIONS[0].x}
          y2={STATUTORY_PROVISIONS[0].y}
          stroke="#EF4444"
          strokeWidth="1.5"
          strokeDasharray={reducedMotion ? "none" : "3 3"}
          opacity="0.85"
        />
        <line
          x1={queryX}
          y1={queryY}
          x2={STATUTORY_PROVISIONS[1].x}
          y2={STATUTORY_PROVISIONS[1].y}
          stroke="#EF4444"
          strokeWidth="1.2"
          strokeDasharray={reducedMotion ? "none" : "3 3"}
          opacity="0.6"
        />

        {/* Faint context links to other non-matching statutes */}
        <line x1={queryX} y1={queryY} x2={STATUTORY_PROVISIONS[4].x} y2={STATUTORY_PROVISIONS[4].y} stroke="#383842" strokeWidth="0.8" strokeDasharray="1 3" />
        <line x1={queryX} y1={queryY} x2={STATUTORY_PROVISIONS[2].x} y2={STATUTORY_PROVISIONS[2].y} stroke="#383842" strokeWidth="0.8" strokeDasharray="1 3" />

        {/* Statutory provisions nodes */}
        {STATUTORY_PROVISIONS.map((node) => {
          const isMatch = node.isMatch;
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {isMatch && (
                <circle cx="0" cy="0" r="18" fill="url(#matchGlow)" />
              )}
              <circle
                cx="0"
                cy="0"
                r={isMatch ? 4.5 : 3}
                fill={isMatch ? "#EF4444" : "#4E4C45"}
                stroke={isMatch ? "#F2F0EA" : "#2D2D38"}
                strokeWidth={isMatch ? 1.5 : 1}
              />
              {/* Text label */}
              <text
                x={node.x > 300 ? -8 : 8}
                y={node.y > 170 ? 14 : -8}
                textAnchor={node.x > 300 ? "end" : "start"}
                fill={isMatch ? "#F2F0EA" : "#737168"}
                fontSize={isMatch ? "10" : "8.5"}
                fontWeight={isMatch ? "bold" : "normal"}
              >
                {node.act} {node.section}
              </text>
              <text
                x={node.x > 300 ? -8 : 8}
                y={node.y > 170 ? 24 : 2}
                textAnchor={node.x > 300 ? "end" : "start"}
                fill={isMatch ? "#A8A69E" : "#4E4C45"}
                fontSize="7.5"
              >
                [{node.jurisdiction}]
              </text>
            </g>
          );
        })}

        {/* Incoming Plain-Language Query Vector Point */}
        <g transform={`translate(${queryX}, ${queryY})`}>
          <circle cx="0" cy="0" r="22" fill="url(#queryGlow)" />
          <circle cx="0" cy="0" r="4.5" fill="#F2F0EA" stroke="#EF4444" strokeWidth="1.5" />
          <rect
            x="10"
            y="-18"
            width="145"
            height="22"
            fill="#17171C"
            stroke="#4E4C45"
            strokeWidth="0.8"
          />
          <text x="16" y="-3" fill="#F2F0EA" fontSize="9" fontWeight="bold">
            USER STATEMENT
          </text>
          <text x="16" y="16" fill="#A8A69E" fontSize="8" fontStyle="italic">
            “unpaid salary for 2 months”
          </text>
        </g>
      </svg>

      {/* Caption description */}
      <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-3)] flex-wrap gap-2">
        <span>SEMANTIC RETRIEVAL · K-NEAREST PROVISIONS</span>
        <span className="text-[var(--accent-crimson)]">MATCH: PAYMENT OF WAGES ACT §15</span>
      </div>
    </div>
  );
}
