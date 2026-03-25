"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

function MonthlyContent() {
  const sp = useSearchParams();
  const name = sp.get("name") || "You";

  const months = [
    { label: "April 2025", tag: "This month", energy: "Breakthrough energy. Push the thing you've been hesitating on." },
    { label: "May 2025", tag: "", energy: "Consolidation. Protect what you built in April — don't scatter." },
    { label: "June 2025", tag: "", energy: "Connection peaks. The right people arrive at the right time." },
  ];

  return (
    <main className="min-h-screen px-4 py-10 max-w-sm mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <a href="/" className="text-muted hover:text-text text-sm transition-colors">← Home</a>
        <Logo size="sm" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-accent">Monthly Fortune</p>
        <h1 className="text-2xl font-display font-bold text-text">{name}</h1>
        <p className="text-xs text-muted">Active subscription · Renews monthly</p>
      </div>

      <div className="space-y-3">
        {months.map((month) => (
          <div
            key={month.label}
            className="bg-surface border border-border rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">{month.label}</span>
              {month.tag && (
                <span className="text-[10px] uppercase tracking-widest bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                  {month.tag}
                </span>
              )}
            </div>
            <p className="text-sm text-muted leading-relaxed">{month.energy}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted/50 pb-8">
        New forecast added on the 1st of each month.
      </p>
    </main>
  );
}

export default function MonthlyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted text-sm animate-pulse">Loading…</div>}>
      <MonthlyContent />
    </Suspense>
  );
}
