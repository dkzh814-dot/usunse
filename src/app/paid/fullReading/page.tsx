"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import StreamingAnalysis from "@/components/StreamingAnalysis";
import FourPillarsDisplay from "@/components/FourPillarsDisplay";
import { calculateFourPillars } from "@/lib/saju";

function FullReadingContent() {
  const sp = useSearchParams();
  const name = sp.get("name") || "You";
  const dob = sp.get("dob") || "";
  const hour = sp.get("hour") || undefined;

  if (!dob) return <div className="text-muted text-sm"><a href="/">← Home</a></div>;

  const [y, m, d] = dob.split("-").map(Number);
  const pillars = calculateFourPillars(y, m, d, hour ? parseInt(hour) : undefined);

  return (
    <main className="min-h-screen px-4 py-10 max-w-sm mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <a href="/" className="text-muted hover:text-text text-sm transition-colors">← Home</a>
        <Logo size="sm" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-accent">Full Saju Life Reading</p>
        <h1 className="text-2xl font-display font-bold text-text">{name}</h1>
      </div>

      <FourPillarsDisplay pillars={pillars} label="Your Four Pillars" />

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-1">
        <StreamingAnalysis name={name} dob={dob} hour={hour} tier="fullReading" />
      </div>

      <div className="text-center pb-8">
        <a
          href={`/result?name=${encodeURIComponent(name)}&dob=${dob}${hour ? `&hour=${hour}` : ""}`}
          className="text-xs text-muted hover:text-accent transition-colors"
        >
          ← Back to free result
        </a>
      </div>
    </main>
  );
}

export default function FullReadingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted text-sm animate-pulse">Loading…</div>}>
      <FullReadingContent />
    </Suspense>
  );
}
