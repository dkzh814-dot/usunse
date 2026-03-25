"use client";

import { FourPillars } from "@/lib/saju";

interface FourPillarsDisplayProps {
  pillars: FourPillars;
  label?: string;
}

export default function FourPillarsDisplay({
  pillars,
  label,
}: FourPillarsDisplayProps) {
  const columns = [
    { title: "年", pillar: pillars.year, sub: "Year" },
    { title: "月", pillar: pillars.month, sub: "Month" },
    { title: "日", pillar: pillars.day, sub: "Day" },
    ...(pillars.hour
      ? [{ title: "時", pillar: pillars.hour, sub: "Hour" }]
      : []),
  ];

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs uppercase tracking-widest text-muted text-center">
          {label}
        </p>
      )}
      <div className="flex gap-2 justify-center">
        {columns.map(({ title, pillar, sub }) => (
          <div
            key={sub}
            className="flex flex-col items-center bg-surface border border-border rounded-xl p-3 min-w-[60px]"
          >
            <span className="text-xs text-muted mb-1">{title}</span>
            <span className="text-2xl font-bold text-text leading-none">
              {pillar.heavenlyStem}
            </span>
            <span className="text-2xl font-bold text-accent/80 leading-none mt-1">
              {pillar.earthlyBranch}
            </span>
            <span className="text-[10px] text-muted/60 mt-2 tracking-wide">
              {sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
