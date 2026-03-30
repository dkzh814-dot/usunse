"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getFiveElementsResult, FiveElementsResult, ELEMENT_META } from "@/lib/fiveElements";
import { Element } from "@/lib/saju";
import { REPEL_TYPES } from "@/lib/repel";
import FiveElementsDiagram from "@/components/FiveElementsDiagram";
import EmailGate from "@/components/EmailGate";
import FiveElementsShareModal from "@/components/FiveElementsShareModal";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function safeDocId(email: string, dob: string, test: string): string {
  return `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${dob}_${test}`;
}

const HOUR_LABELS: Record<string, string> = {
  "23": "자  11:30pm – 1:29am",
  "2":  "축  1:30am – 3:29am",
  "3":  "인  3:30am – 5:29am",
  "5":  "묘  5:30am – 7:29am",
  "7":  "진  7:30am – 9:29am",
  "9":  "사  9:30am – 11:29am",
  "11": "오  11:30am – 1:29pm",
  "13": "미  1:30pm – 3:29pm",
  "15": "신  3:30pm – 5:29pm",
  "17": "유  5:30pm – 7:29pm",
  "19": "술  7:30pm – 9:29pm",
  "21": "해  9:30pm – 11:29pm",
};

function formatDobDisplay(dob: string): string {
  const [y, m, d] = dob.split("-");
  return `${m}/${d}/${y}`;
}

function MyFiveElementsContent() {
  const searchParams = useSearchParams();
  const name   = searchParams.get("name") || "You";
  const dob    = searchParams.get("dob")  || "";
  const hourStr = searchParams.get("hour");

  const [unlocked, setUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [result, setResult] = useState<FiveElementsResult | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!dob) return;
    const [y, m, d] = dob.split("-").map(Number);
    const hour = hourStr !== null ? parseInt(hourStr) : undefined;
    setResult(getFiveElementsResult(y, m, d, hour));
  }, [dob, hourStr]);

  async function handleUnlock(email: string) {
    setUserEmail(email);
    try {
      if (result) {
        const docRef = doc(db, "completions", safeDocId(email, dob, "five-elements"));
        await setDoc(docRef, {
          email, dob, test: "five-elements",
          counts:      result.counts,
          dominant:    result.dominant,
          missing:     result.missing,
          usedPillars: result.usedPillars,
          createdAt:   serverTimestamp(),
        });
      }
    } catch { /* don't block */ }
    setUnlocked(true);
    window.scrollTo(0, 0);
  }

  if (!dob || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <a href="/my-five-elements" className="text-muted text-sm hover:text-accent transition-colors">← Start over</a>
      </div>
    );
  }

  const resultUrl = typeof window !== "undefined"
    ? `${window.location.origin}/my-five-elements-result?${new URLSearchParams({ name, dob, ...(hourStr ? { hour: hourStr } : {}) }).toString()}`
    : "";

  const energyTypeKey = `${result.dominant[0]}-${result.missing[0]}`;
  const energyTypeName =
    REPEL_TYPES[energyTypeKey]?.name ??
    REPEL_TYPES[Object.keys(REPEL_TYPES).find(k => k.startsWith(result.dominant[0] + "-")) ?? ""]?.name ??
    "The Unknown";

  const shareText = `I am ${energyTypeName} ✦ usunse.com`;

  return (
    <main className="min-h-screen px-4 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {!unlocked && (
        <EmailGate
          onUnlock={handleUnlock}
          idolName="your chart"
          name={name}
          dob={dob}
          title="Your elements are ready"
          subtitle="Enter your email to reveal the breakdown of your chart."
        />
      )}

      {shareOpen && (
        <FiveElementsShareModal
          name={name}
          result={result}
          energyTypeName={energyTypeName}
          userEmail={userEmail}
          resultUrl={resultUrl}
          shareText={shareText}
          onClose={() => setShareOpen(false)}
        />
      )}

      <div className={`max-w-sm mx-auto space-y-8 transition-all duration-500 ${!unlocked ? "blur-sm pointer-events-none select-none" : ""}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <a href="/my-five-elements" className="text-muted hover:text-text transition-colors text-sm">← Back</a>
          <div className="flex flex-col items-center leading-none gap-0">
            <span className="text-sm font-bold gradient-text">US</span>
            <span className="text-xs font-bold gradient-text">NE</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-black text-text/90">My Five Elements</h1>
          <p className="text-sm text-muted/60 mt-1">{name}</p>
          <p className="text-xs text-muted/40 mt-0.5">
            {formatDobDisplay(dob)}{hourStr && HOUR_LABELS[hourStr] ? ` · ${HOUR_LABELS[hourStr]}` : ""}
          </p>
        </div>

        {/* Energy Type identity */}
        <div className="text-center">
          <p className="text-xs text-muted/50 uppercase tracking-widest mb-1">Your Energy Type</p>
          <p className="text-2xl font-display font-black gradient-text">You are {energyTypeName}</p>
        </div>

        {/* Pentagon diagram */}
        <FiveElementsDiagram
          counts={result.counts}
          dominant={result.dominant}
          missing={result.missing}
        />

        {result.usedPillars === 3 && (
          <p className="text-xs text-muted/50 text-center">Based on 3 pillars · 6 elements (birth hour not provided)</p>
        )}

        {/* Share button */}
        <button onClick={() => setShareOpen(true)}
          className="w-full py-4 rounded-xl font-semibold text-sm tracking-wide
            bg-gradient-to-r from-accent to-accent-2 text-white
            hover:opacity-90 active:scale-[0.98] transition-all">
          Share My Result
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center">
            <span className="bg-bg px-4 text-xs text-muted/60 uppercase tracking-widest">What does this mean?</span>
          </div>
        </div>

        {/* $10 upsell */}
        <a href="/paid/fullReading"
          className="block rounded-xl border border-accent/20 bg-[#12121a]/60 p-5 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text/90">Unlock Your Full Destiny Reading →</p>
              <p className="text-xs text-muted/60 leading-snug">Your personality, career, love, and life cycles — read through your complete chart.</p>
            </div>
            <span className="text-base font-bold gradient-text whitespace-nowrap">$10</span>
          </div>
        </a>

        <div className="h-8" />
      </div>
    </main>
  );
}

export default function MyFiveElementsResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm animate-pulse">Calculating your chart…</div>
      </div>
    }>
      <MyFiveElementsContent />
    </Suspense>
  );
}
