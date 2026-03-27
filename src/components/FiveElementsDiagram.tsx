"use client";

import { Element } from "@/lib/saju";
import { ELEMENT_META } from "@/lib/fiveElements";

interface Props {
  counts: Record<Element, number>;
  dominant: Element[];
  missing: Element[];
}

const EL_COLOR: Record<Element, string> = {
  wood:  "#4CAF50",
  fire:  "#EF5350",
  earth: "#C8971A",
  metal: "#9E9E9E",
  water: "#1565C0",
};

// Pentagon layout clockwise from top, matching 상생 cycle:
// 화(top) → 토(top-right) → 금(bottom-right) → 수(bottom-left) → 목(top-left) → 화
const NODES: Array<{ el: Element; angleDeg: number }> = [
  { el: "fire",  angleDeg: -90 },
  { el: "earth", angleDeg: -18 },
  { el: "metal", angleDeg:  54 },
  { el: "water", angleDeg: 126 },
  { el: "wood",  angleDeg: 198 },
];

// 상생 (generative) — outer pentagon clockwise arrows
const GENERATIVE: [Element, Element][] = [
  ["wood", "fire"], ["fire", "earth"], ["earth", "metal"], ["metal", "water"], ["water", "wood"],
];

// 상극 (destructive) — inner pentagram arrows
const DESTRUCTIVE: [Element, Element][] = [
  ["wood", "earth"], ["fire", "metal"], ["earth", "water"], ["metal", "wood"], ["water", "fire"],
];

// ── Icons (centered at origin, scale via transform) ──────────────────────────

function WoodIcon({ r }: { r: number }) {
  const s = r * 0.52;
  return (
    <g fill="white" opacity="0.92">
      <polygon points={`0,${-s} ${-s*0.62},${-s*0.08} ${s*0.62},${-s*0.08}`} />
      <polygon points={`0,${-s*0.46} ${-s*0.78},${s*0.38} ${s*0.78},${s*0.38}`} />
      <rect x={-s*0.16} y={s*0.38} width={s*0.32} height={s*0.55} />
    </g>
  );
}

function FireIcon({ r }: { r: number }) {
  const s = r * 0.52;
  return (
    <g fill="white" opacity="0.92">
      <path d={`
        M0,${s*0.9}
        C${-s*0.45},${s*0.5} ${-s*0.55},${-s*0.05} ${-s*0.25},${-s*0.5}
        C${-s*0.2},${-s*0.1} ${-s*0.05},${s*0.1} 0,${s*0.1}
        C${s*0.05},${-s*0.3} ${s*0.15},${-s*0.75} 0,${-s*0.9}
        C${s*0.3},${-s*0.35} ${s*0.55},${s*0.1} ${s*0.45},${s*0.55}
        C${s*0.35},${s*0.2} ${s*0.2},0 ${s*0.2},0
        C${s*0.35},${s*0.5} ${s*0.2},${s*0.9} 0,${s*0.9}Z
      `} />
    </g>
  );
}

function EarthIcon({ r }: { r: number }) {
  const s = r * 0.52;
  return (
    <g fill="white" opacity="0.92">
      <rect x={-s*0.72} y={-s*0.18} width={s*1.44} height={s*0.3} rx={s*0.15} />
      <rect x={-s*0.52} y={-s*0.62} width={s*1.04} height={s*0.27} rx={s*0.135} />
      <rect x={-s*0.32} y={-s*0.97} width={s*0.64} height={s*0.24} rx={s*0.12} />
    </g>
  );
}

function MetalIcon({ r }: { r: number }) {
  const s = r * 0.52;
  return (
    <g fill="white" opacity="0.92">
      <polygon points={`0,${-s*0.88} ${s*0.62},0 0,${s*0.88} ${-s*0.62},0`} />
      <polygon points={`0,${-s*0.48} ${s*0.34},0 0,${s*0.48} ${-s*0.34},0`}
        fill="rgba(255,255,255,0.45)" />
    </g>
  );
}

function WaterIcon({ r }: { r: number }) {
  const s = r * 0.52;
  return (
    <g stroke="white" strokeWidth={s*0.18} fill="none" opacity="0.92" strokeLinecap="round">
      <path d={`M${-s*0.75},${-s*0.42} Q${-s*0.375},${-s*0.72} 0,${-s*0.42} Q${s*0.375},${-s*0.12} ${s*0.75},${-s*0.42}`} />
      <path d={`M${-s*0.75},${s*0.04} Q${-s*0.375},${-s*0.26} 0,${s*0.04} Q${s*0.375},${s*0.34} ${s*0.75},${s*0.04}`} />
      <path d={`M${-s*0.75},${s*0.5} Q${-s*0.375},${s*0.2} 0,${s*0.5} Q${s*0.375},${s*0.8} ${s*0.75},${s*0.5}`} />
    </g>
  );
}

function ElementIcon({ el, r }: { el: Element; r: number }) {
  switch (el) {
    case "wood":  return <WoodIcon r={r} />;
    case "fire":  return <FireIcon r={r} />;
    case "earth": return <EarthIcon r={r} />;
    case "metal": return <MetalIcon r={r} />;
    case "water": return <WaterIcon r={r} />;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FiveElementsDiagram({ counts, dominant, missing }: Props) {
  const cx = 200, cy = 215, pentR = 140;

  // Compute node centers
  const pos: Record<Element, { x: number; y: number }> = {} as Record<Element, { x: number; y: number }>;
  for (const { el, angleDeg } of NODES) {
    const rad = (angleDeg * Math.PI) / 180;
    pos[el] = { x: cx + pentR * Math.cos(rad), y: cy + pentR * Math.sin(rad) };
  }

  // Circle radius based on count
  const getR = (el: Element) => {
    const c = counts[el];
    if (c === 0) return 14;
    return 20 + c * 7;
  };

  // Arrow endpoints offset by circle radius + gap
  const arrowPts = (from: Element, to: Element, gap = 8) => {
    const f = pos[from], t = pos[to];
    const dx = t.x - f.x, dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    return {
      x1: f.x + (getR(from) + gap) * ux,
      y1: f.y + (getR(from) + gap) * uy,
      x2: t.x - (getR(to) + gap) * ux,
      y2: t.y - (getR(to) + gap) * uy,
    };
  };

  return (
    <svg viewBox="0 0 400 430" className="w-full max-w-[400px] mx-auto block">
      <defs>
        <marker id="arr-gen" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon points="0 0, 7 2.5, 0 5" fill="#666" />
        </marker>
        <marker id="arr-des" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon points="0 0, 7 2.5, 0 5" fill="#e53935" />
        </marker>
      </defs>

      {/* 상극 lines — red inner star */}
      {DESTRUCTIVE.map(([from, to]) => {
        const { x1, y1, x2, y2 } = arrowPts(from, to, 10);
        return (
          <line key={`d-${from}-${to}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#e53935" strokeWidth="1.4" opacity="0.65"
            markerEnd="url(#arr-des)"
          />
        );
      })}

      {/* 상생 lines — dark outer pentagon */}
      {GENERATIVE.map(([from, to]) => {
        const { x1, y1, x2, y2 } = arrowPts(from, to, 10);
        return (
          <line key={`g-${from}-${to}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#555" strokeWidth="1.4"
            markerEnd="url(#arr-gen)"
          />
        );
      })}

      {/* Element nodes */}
      {NODES.map(({ el }) => {
        const { x, y } = pos[el];
        const r = getR(el);
        const isDominant = dominant.includes(el);
        const isMissing = missing.includes(el);
        const color = EL_COLOR[el];
        const { korean, english } = ELEMENT_META[el];
        const count = counts[el];
        const nodeOpacity = isMissing ? 0.22 : 1;

        return (
          <g key={el} opacity={nodeOpacity}>
            {/* Pulse ring for dominant */}
            {isDominant && (
              <circle cx={x} cy={y} r={r + 5} fill="none" stroke={color} strokeWidth="1.8">
                <animate attributeName="opacity" values="0.55;0.1;0.55" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="r" values={`${r+4};${r+9};${r+4}`} dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Main circle */}
            <circle cx={x} cy={y} r={r} fill={color}
              style={isDominant ? { filter: `drop-shadow(0 0 10px ${color})` } : undefined}
            />

            {/* Element icon */}
            <g transform={`translate(${x},${y})`}>
              <ElementIcon el={el} r={r} />
            </g>

            {/* Count badge */}
            {!isMissing && (
              <>
                <circle cx={x + r * 0.68} cy={y - r * 0.68} r={8.5}
                  fill="#0d0d1a" stroke={color} strokeWidth="1.5" />
                <text x={x + r * 0.68} y={y - r * 0.68 + 4}
                  textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
                  {count}
                </text>
              </>
            )}

            {/* Label */}
            <text x={x} y={y + r + 16}
              textAnchor="middle" fontSize="12" fontWeight="500"
              fill={isMissing ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)"}>
              {korean} {english}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
