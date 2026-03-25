"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getIdolMatch, IdolMatch } from "@/lib/idols";
import ScoreRing from "@/components/ScoreRing";
import FourPillarsDisplay from "@/components/FourPillarsDisplay";
import EmailGate from "@/components/EmailGate";
import TierCards from "@/components/TierCards";
import Logo from "@/components/Logo";

// Compatibility description without element names (hard rule)
function getCompatibilityDescription(score: number, idolName: string, userName: string): string {
  if (score >= 85) {
    return `${userName} and ${idolName} share a rare celestial alignment that appears once in a generation. Your charts mirror each other in ways that go far beyond coincidence — the universe drew this connection long before either of you were born.`;
  }
  if (score >= 75) {
    return `The bond between ${userName} and ${idolName} is written in the stars with unusual clarity. Your pillars complement each other in a way that creates both harmony and a magnetic pull — the kind of match that feels like coming home.`;
  }
  if (score >= 65) {
    return `${userName} and ${idolName} carry a genuine cosmic thread between them. There's an ease here, a rhythm that doesn't need explaining — your charts simply agree with each other in the most fundamental way.`;
  }
  return `${userName} and ${idolName} have an intriguing dynamic in their charts — contrast that sparks growth. The tension in your pillars isn't a warning. It's an invitation.`;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "You";
  const dob = searchParams.get("dob") || "";
  const hourStr = searchParams.get("hour");

  const [unlocked, setUnlocked] = useState(false);
  const [match, setMatch] = useState<IdolMatch | null>(null);
  const [shareText, setShareText] = useState("");

  useEffect(() => {
    if (!dob) return;
    const [y, m, d] = dob.split("-").map(Number);
    const hour = hourStr !== null ? parseInt(hourStr) : undefined;
    const result = getIdolMatch(y, m, d, hour);
    setMatch(result);

    const text = `My K-pop destiny match is ${result.idol.name} (${result.idol.group}) — ${result.score}% compatibility! ✨ Find yours at usunse.com`;
    setShareText(text);
  }, [dob, hourStr]);

  if (!dob || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm">
          <a href="/" className="hover:text-accent transition-colors">← Start over</a>
        </div>
      </div>
    );
  }

  const description = getCompatibilityDescription(match.score, match.idol.name, name);
  const spParams = { name: name || "", dob: dob || "", ...(hourStr ? { hour: hourStr } : {}) };

  return (
    <main className="min-h-screen px-4 py-10 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Email gate overlay */}
      {!unlocked && (
        <EmailGate onUnlock={() => setUnlocked(true)} idolName={match.idol.name} />
      )}

      <div className={`max-w-sm mx-auto space-y-8 transition-all duration-500 ${!unlocked ? "blur-sm pointer-events-none select-none" : ""}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <a href="/" className="text-muted hover:text-text transition-colors text-sm">
            ← Back
          </a>
          <Logo size="sm" />
        </div>

        {/* Match reveal */}
        <div className="text-center space-y-1 animate-fade-up">
          <p className="text-xs uppercase tracking-widest text-muted">
            {name}&apos;s destiny match
          </p>
          <div className="text-5xl mt-2">{match.idol.emoji}</div>
          <h1 className="text-3xl font-display font-bold gradient-text mt-2">
            {match.idol.name}
          </h1>
          <p className="text-muted text-sm">{match.idol.group}</p>
        </div>

        {/* Score ring */}
        <div className="flex justify-center">
          <ScoreRing score={match.score} size={160} />
        </div>

        {/* Description — no element names */}
        <div className="space-y-3">
          <p className="text-sm text-text/90 leading-relaxed text-center font-display italic">
            &ldquo;{description}&rdquo;
          </p>
        </div>

        {/* Four Pillars — Chinese characters only */}
        <FourPillarsDisplay pillars={match.userPillars} label="Your Four Pillars" />

        {/* Share buttons */}
        <div className="flex gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-text text-center hover:border-accent transition-colors"
          >
            𝕏 Share
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/result?${new URLSearchParams(spParams).toString()}`
              );
            }}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted text-center hover:border-accent hover:text-text transition-colors"
          >
            Copy link
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg px-4 text-xs text-muted/60 uppercase tracking-widest">
              Want more?
            </span>
          </div>
        </div>

        {/* Tier cards */}
        <TierCards searchParams={spParams} />

        <div className="h-8" />
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted text-sm animate-pulse">Reading the stars…</div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
