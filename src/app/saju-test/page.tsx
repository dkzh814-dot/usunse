"use client";

import { useEffect, useState } from "react";

// Keywords that identify the 6 target categories
const CATEGORY_FILTERS: { label: string; keywords: string[] }[] = [
  {
    label: "일주 해석",
    keywords: ["ilju", "일주", "dayPillar", "day_pillar", "dayStem", "dayBranch", "일간", "일지"],
  },
  {
    label: "연애운 / 배우자운",
    keywords: ["연애", "배우자", "love", "spouse", "romance", "partner", "결혼", "marriage", "이성", "관성", "정관", "편관"],
  },
  {
    label: "십신 해석",
    keywords: ["십신", "sipsin", "tenGod", "ten_god", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인", "비견", "겁재"],
  },
  {
    label: "용신 / 희신 / 기신",
    keywords: ["용신", "yongshin", "yongsin", "희신", "hishin", "hisin", "기신", "gishin", "gisin", "구신", "한신"],
  },
  {
    label: "격국",
    keywords: ["격국", "gyeokguk", "gyeokgook", "格局", "格", "격"],
  },
  {
    label: "신강 / 신약",
    keywords: ["신강", "신약", "singang", "sinyang", "강약", "bodyStrength", "chartStrength", "strength"],
  },
];

function matchesCategory(path: string): string | null {
  const lower = path.toLowerCase();
  for (const cat of CATEGORY_FILTERS) {
    if (cat.keywords.some(kw => lower.includes(kw.toLowerCase()))) return cat.label;
  }
  return null;
}

function flatten(obj: unknown, prefix = ""): Record<string, string> {
  if (obj === null || obj === undefined) return prefix ? { [prefix]: String(obj) } : {};
  if (typeof obj !== "object") return prefix ? { [prefix]: JSON.stringify(obj) } : {};
  if (Array.isArray(obj)) {
    const out: Record<string, string> = {};
    obj.forEach((v, i) => Object.assign(out, flatten(v, prefix ? `${prefix}[${i}]` : `[${i}]`)));
    return out;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

type DiffRow = { path: string; male: string; female: string; category?: string | null };

function DiffTable({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-white/5 text-white/40 text-[10px] uppercase tracking-widest">
            <th className="text-left px-4 py-2.5 border-b border-white/10 w-2/5">Field</th>
            <th className="text-left px-4 py-2.5 border-b border-white/10 text-blue-400">Male</th>
            <th className="text-left px-4 py-2.5 border-b border-white/10 text-pink-400">Female</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.path} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
              <td className="px-4 py-2.5 font-mono text-white/50 break-all border-b border-white/5">{row.path}</td>
              <td className="px-4 py-2.5 font-mono text-blue-300 break-all border-b border-white/5">{row.male}</td>
              <td className="px-4 py-2.5 font-mono text-pink-300 break-all border-b border-white/5">{row.female}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SajuTestPage() {
  const [data, setData] = useState<{ male: unknown; female: unknown; statusMale: number; statusFemale: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/saju-test")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("API call failed"); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <p className="text-sm text-gray-400 animate-pulse">Calling API (male + female)…</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <p className="text-red-400 text-sm">{error || "No data"}</p>
    </div>
  );

  const mFlat = flatten(data.male);
  const fFlat = flatten(data.female);
  const allKeys = Array.from(new Set([...Object.keys(mFlat), ...Object.keys(fFlat)])).sort();

  // All diffs
  const allDiffs: (DiffRow & { category: string | null })[] = allKeys
    .filter(k => mFlat[k] !== fFlat[k])
    .map(k => ({ path: k, male: mFlat[k] ?? "(missing)", female: fFlat[k] ?? "(missing)", category: matchesCategory(k) }));

  // Category-filtered diffs
  const filtered = allDiffs.filter(r => r.category !== null);

  // Group by category
  const grouped: Record<string, (DiffRow & { category: string | null })[]> = {};
  for (const row of filtered) {
    const cat = row.category!;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(row);
  }

  // All fields matching categories (even identical) — for "no diff" notice
  const allCatKeys = allKeys.filter(k => matchesCategory(k) !== null);
  const noCatDiff = allCatKeys.filter(k => mFlat[k] === fFlat[k]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-4 max-w-4xl mx-auto">
      <h1 className="text-lg font-bold mb-1">Woonsewiki API — Category diff</h1>
      <p className="text-xs text-gray-500 mb-1">POST luckyloveme.com/api/saju-full-analysis · 정다송 · 1991.08.14 10:40 양력</p>
      <p className="text-xs mb-6">
        <span className={data.statusMale === 200 ? "text-green-400" : "text-red-400"}>male {data.statusMale}</span>
        <span className="text-gray-600 mx-2">·</span>
        <span className={data.statusFemale === 200 ? "text-green-400" : "text-red-400"}>female {data.statusFemale}</span>
        <span className="text-gray-600 mx-2">·</span>
        <span className="text-yellow-400">{filtered.length} target field{filtered.length !== 1 ? "s" : ""} differ</span>
        <span className="text-gray-600 mx-2">·</span>
        <span className="text-gray-500">{noCatDiff.length} target fields identical (hidden)</span>
      </p>

      {filtered.length === 0 ? (
        <div className="space-y-3">
          <p className="text-yellow-400 text-sm">No differences found in the 6 target categories.</p>
          <p className="text-xs text-gray-500">
            Matched {allCatKeys.length} fields across categories — all identical between male and female.
            Total API diffs across all fields: {allDiffs.length}
          </p>
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">Show all {allDiffs.length} non-category diffs</summary>
            <DiffTable rows={allDiffs} />
          </details>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_FILTERS.map(cat => {
            const rows = grouped[cat.label];
            if (!rows || rows.length === 0) return (
              <div key={cat.label}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">{cat.label}</p>
                <p className="text-xs text-gray-600 pl-1">No differences found in this category.</p>
              </div>
            );
            return (
              <div key={cat.label}>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  {cat.label} <span className="text-yellow-400 normal-case font-normal">({rows.length} diff)</span>
                </p>
                <DiffTable rows={rows} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
