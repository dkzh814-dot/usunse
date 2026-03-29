"use client";

import { useEffect, useState } from "react";

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

type DiffRow = { path: string; male: string; female: string };

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
  const diffs: DiffRow[] = allKeys
    .filter(k => mFlat[k] !== fFlat[k])
    .map(k => ({ path: k, male: mFlat[k] ?? "(missing)", female: fFlat[k] ?? "(missing)" }));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-4 max-w-5xl mx-auto">
      <h1 className="text-lg font-bold mb-1">Woonsewiki API — Male vs Female diff</h1>
      <p className="text-xs text-gray-500 mb-1">POST luckyloveme.com/api/saju-full-analysis · 정다송 · 1991.08.14 10:40 양력</p>
      <p className="text-xs mb-6">
        <span className={data.statusMale === 200 ? "text-green-400" : "text-red-400"}>male {data.statusMale}</span>
        <span className="text-gray-600 mx-2">·</span>
        <span className={data.statusFemale === 200 ? "text-green-400" : "text-red-400"}>female {data.statusFemale}</span>
        <span className="text-gray-600 mx-2">·</span>
        <span className="text-yellow-400">{diffs.length} field{diffs.length !== 1 ? "s" : ""} differ</span>
        <span className="text-gray-600 mx-2">·</span>
        <span className="text-gray-500">{allKeys.length - diffs.length} identical (hidden)</span>
      </p>

      {diffs.length === 0 ? (
        <p className="text-green-400 text-sm">Responses are identical.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[10px] uppercase tracking-widest">
                <th className="text-left px-4 py-3 border-b border-white/10 w-2/5">Field</th>
                <th className="text-left px-4 py-3 border-b border-white/10 w-[30%] text-blue-400">Male</th>
                <th className="text-left px-4 py-3 border-b border-white/10 w-[30%] text-pink-400">Female</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((row, i) => (
                <tr key={row.path} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                  <td className="px-4 py-2.5 font-mono text-white/50 break-all border-b border-white/5">{row.path}</td>
                  <td className="px-4 py-2.5 font-mono text-blue-300 break-all border-b border-white/5">{row.male}</td>
                  <td className="px-4 py-2.5 font-mono text-pink-300 break-all border-b border-white/5">{row.female}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
