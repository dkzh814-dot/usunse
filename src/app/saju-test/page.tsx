"use client";

import { useEffect, useState } from "react";

// Recursively collect all dot-notation paths and values from an object
function flatten(obj: unknown, prefix = ""): Record<string, string> {
  if (obj === null || obj === undefined) return { [prefix]: String(obj) };
  if (typeof obj !== "object") return { [prefix]: JSON.stringify(obj) };
  if (Array.isArray(obj)) {
    const out: Record<string, string> = {};
    obj.forEach((v, i) => Object.assign(out, flatten(v, `${prefix}[${i}]`)));
    return out;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

// Render JSON with diff highlights
function JsonDiff({
  data,
  diffKeys,
  side,
}: {
  data: unknown;
  diffKeys: Set<string>;
  side: "male" | "female";
}) {
  function renderValue(val: unknown, path: string, depth: number): React.ReactNode {
    const indent = "  ".repeat(depth);
    if (val === null) return <span className="text-gray-500">null</span>;
    if (typeof val === "boolean") return <span className="text-blue-400">{String(val)}</span>;
    if (typeof val === "number") return <span className="text-yellow-300">{val}</span>;
    if (typeof val === "string") return <span className="text-green-300">"{val}"</span>;

    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-400">[]</span>;
      return (
        <>
          {"[\n"}
          {val.map((item, i) => {
            const childPath = `${path}[${i}]`;
            const isDiff = diffKeys.has(childPath);
            return (
              <span key={i} className={isDiff ? (side === "male" ? "bg-blue-900/40" : "bg-pink-900/40") : ""}>
                {indent}{"  "}{renderValue(item, childPath, depth + 1)}
                {i < val.length - 1 ? "," : ""}{"\n"}
              </span>
            );
          })}
          {indent}{"]"}
        </>
      );
    }

    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-gray-400">{"{}"}</span>;
      return (
        <>
          {"{\n"}
          {entries.map(([k, v], i) => {
            const childPath = path ? `${path}.${k}` : k;
            const isDiff = diffKeys.has(childPath);
            return (
              <span key={k} className={isDiff ? (side === "male" ? "bg-blue-900/50 block" : "bg-pink-900/50 block") : ""}>
                {indent}{"  "}
                <span className="text-purple-300">"{k}"</span>
                {": "}
                {renderValue(v, childPath, depth + 1)}
                {i < entries.length - 1 ? "," : ""}
                {"\n"}
              </span>
            );
          })}
          {indent}{"}"}
        </>
      );
    }
    return <span>{JSON.stringify(val)}</span>;
  }

  return (
    <pre className="text-xs leading-5 font-mono whitespace-pre-wrap break-words overflow-auto max-h-[80vh]">
      {renderValue(data, "", 0)}
    </pre>
  );
}

export default function SajuTestPage() {
  const [data, setData]   = useState<{ male: unknown; female: unknown; statusMale: number; statusFemale: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

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

  const maleFlat   = flatten(data.male);
  const femaleFlat = flatten(data.female);
  const allKeys  = Array.from(new Set([...Object.keys(maleFlat), ...Object.keys(femaleFlat)]));
  const diffKeys = new Set<string>(allKeys.filter(k => maleFlat[k] !== femaleFlat[k]));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-4">
      {/* Header */}
      <div className="mb-4 space-y-1">
        <h1 className="text-lg font-bold">Woonsewiki API Response Inspector</h1>
        <p className="text-xs text-gray-500">
          POST luckyloveme.com/api/saju-full-analysis · 정다송 · 1991.08.14 10:40 양력
        </p>
        <p className="text-xs">
          <span className="text-gray-500">HTTP status: </span>
          <span className={data.statusMale === 200 ? "text-green-400" : "text-red-400"}>male {data.statusMale}</span>
          <span className="text-gray-600 mx-2">·</span>
          <span className={data.statusFemale === 200 ? "text-green-400" : "text-red-400"}>female {data.statusFemale}</span>
          <span className="text-gray-600 mx-2">·</span>
          <span className="text-yellow-400">{diffKeys.size} fields differ</span>
        </p>
        {diffKeys.size > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-[#12121a] border border-white/10">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Differing fields</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(diffKeys).map(k => (
                <span key={k} className="text-[10px] font-mono bg-yellow-900/30 text-yellow-300 px-1.5 py-0.5 rounded">{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-900/50 inline-block" /> male diff</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-900/50 inline-block" /> female diff</span>
      </div>

      {/* Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#12121a] border border-white/10 p-4">
          <p className="text-xs font-semibold text-blue-400 mb-3 uppercase tracking-widest">gender: male</p>
          <JsonDiff data={data.male} diffKeys={diffKeys} side="male" />
        </div>
        <div className="rounded-xl bg-[#12121a] border border-white/10 p-4">
          <p className="text-xs font-semibold text-pink-400 mb-3 uppercase tracking-widest">gender: female</p>
          <JsonDiff data={data.female} diffKeys={diffKeys} side="female" />
        </div>
      </div>
    </div>
  );
}
