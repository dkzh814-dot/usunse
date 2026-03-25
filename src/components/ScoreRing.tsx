"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
}

export default function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const displayScore = animated ? score : 0;

  const getColor = (s: number) => {
    if (s >= 80) return ["#c084fc", "#f472b6"]; // purple→pink
    if (s >= 65) return ["#818cf8", "#c084fc"]; // indigo→purple
    return ["#6366f1", "#818cf8"]; // indigo
  };

  const [c1, c2] = getColor(score);
  const gradientId = `score-gradient-${score}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>

        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#1e1e2e"
          strokeWidth="10"
        />

        {/* Score ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transition: "stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </svg>

      {/* Score number in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <CountUp target={score} active={animated} />
        <span className="text-xs text-muted tracking-widest uppercase mt-0.5">
          match
        </span>
      </div>
    </div>
  );
}

function CountUp({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1600;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target]);

  return (
    <span className="text-3xl font-bold gradient-text tabular-nums">
      {value}%
    </span>
  );
}
