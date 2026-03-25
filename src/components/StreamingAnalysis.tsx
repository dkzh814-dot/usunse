"use client";

import { useEffect, useState } from "react";

interface StreamingAnalysisProps {
  name: string;
  dob: string;
  hour?: string;
  tier: string;
  targetDob?: string;
}

export default function StreamingAnalysis({
  name,
  dob,
  hour,
  tier,
  targetDob,
}: StreamingAnalysisProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalysis() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, dob, hour, tier, targetDob }),
        });

        if (!res.ok) {
          throw new Error("Analysis failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        setLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const chunk = decoder.decode(value, { stream: true });
          setText((prev) => prev + chunk);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Something went wrong. Please try again.");
          setLoading(false);
        }
      }
    }

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [name, dob, hour, tier, targetDob]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer h-4 rounded-full"
            style={{ width: `${70 + i * 10}%` }}
          />
        ))}
        <p className="text-xs text-muted text-center pt-2 animate-pulse">
          Consulting the stars…
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  // Format paragraphs
  const paragraphs = text.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-5">
      {paragraphs.map((para, i) => {
        // Detect section headers (e.g., "**Who You Are**")
        const headerMatch = para.match(/^\*\*(.+?)\*\*/);
        if (headerMatch) {
          const header = headerMatch[1];
          const body = para.replace(/^\*\*(.+?)\*\*\s*/, "");
          return (
            <div key={i} className="space-y-1.5">
              <h3 className="text-xs uppercase tracking-widest text-accent font-semibold">
                {header}
              </h3>
              <p className="text-sm text-text/85 leading-relaxed">{body}</p>
            </div>
          );
        }
        // First paragraph gets display treatment
        if (i === 0) {
          return (
            <p key={i} className="text-base font-display italic text-text leading-relaxed">
              &ldquo;{para}&rdquo;
            </p>
          );
        }
        return (
          <p key={i} className="text-sm text-text/85 leading-relaxed">
            {para}
          </p>
        );
      })}

      {/* Cursor blink while streaming */}
      {text && paragraphs[paragraphs.length - 1] === text.split("\n\n").filter(Boolean).slice(-1)[0] && (
        <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
