"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import StreamingAnalysis from "@/components/StreamingAnalysis";

function CompatibilityContent() {
  const sp = useSearchParams();
  const name = sp.get("name") || "You";
  const dob = sp.get("dob") || "";
  const hour = sp.get("hour") || undefined;

  const [targetDob, setTargetDob] = useState("");
  const [started, setStarted] = useState(false);

  if (!dob) return <div className="text-muted text-sm"><a href="/">← Home</a></div>;

  return (
    <main className="min-h-screen px-4 py-10 max-w-sm mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <a href="/" className="text-muted hover:text-text text-sm transition-colors">← Home</a>
        <Logo size="sm" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-accent">Detailed Compatibility</p>
        <h1 className="text-2xl font-display font-bold text-text">{name}</h1>
        <p className="text-sm text-muted">Enter the person you want to check.</p>
      </div>

      {!started ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">
              Their Date of Birth
            </label>
            <input
              type="date"
              value={targetDob}
              onChange={(e) => setTargetDob(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <button
            onClick={() => targetDob && setStarted(true)}
            disabled={!targetDob}
            className="w-full py-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-pink-600 to-rose-600 text-white disabled:opacity-40 hover:opacity-90 transition-all"
          >
            Check Compatibility →
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <StreamingAnalysis
            name={name}
            dob={dob}
            hour={hour}
            tier="compatibility"
            targetDob={targetDob}
          />
        </div>
      )}
    </main>
  );
}

export default function CompatibilityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted text-sm animate-pulse">Loading…</div>}>
      <CompatibilityContent />
    </Suspense>
  );
}
