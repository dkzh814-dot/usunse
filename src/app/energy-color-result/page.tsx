"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getEnergyColorResult, EnergyColorResult } from "@/lib/energyColor";
import EmailGate from "@/components/EmailGate";
import EnergyColorShareModal from "@/components/EnergyColorShareModal";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function safeDocId(email: string, dob: string, test: string): string {
  return `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${dob}_${test}`;
}

function EnergyColorResultContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "You";
  const dob = searchParams.get("dob") || "";

  const [unlocked, setUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [result, setResult] = useState<EnergyColorResult | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!dob) return;
    const [y, m, d] = dob.split("-").map(Number);
    setResult(getEnergyColorResult(y, m, d));
  }, [dob]);

  async function handleUnlock(email: string) {
    setUserEmail(email);
    try {
      const docRef = doc(db, "completions", safeDocId(email, dob, "energy-color"));
      const [y, m, d] = dob.split("-").map(Number);
      const calculated = getEnergyColorResult(y, m, d);
      setResult(calculated);
      await setDoc(docRef, {
        email, dob, test: "energy-color",
        key: calculated.key,
        color: calculated.color,
        name: calculated.name,
        desc: calculated.desc,
        createdAt: serverTimestamp(),
      });
    } catch { /* don't block */ }
    setUnlocked(true);
    window.scrollTo(0, 0);
  }

  if (!dob || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm">
          <a href="/energy-color" className="hover:text-accent transition-colors">← Start over</a>
        </div>
      </div>
    );
  }

  const resultUrl = typeof window !== "undefined"
    ? `${window.location.origin}/energy-color-result?${new URLSearchParams({ name, dob }).toString()}`
    : "";
  const shareText = `my UsUnse energy color is ${result.name}\n'${result.desc.split(". ")[0]}.'\nusunse.com/energy-color`;
  const spParams = { name, dob };

  return (
    <main className="min-h-screen px-4 py-10 relative overflow-hidden">
      {/* Ambient bg — tinted with result color */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{ background: result.color }}
      />

      {/* Email gate */}
      {!unlocked && (
        <EmailGate
          onUnlock={handleUnlock}
          idolName={result.name}
          name={name}
          dob={dob}
          title="Your color is ready"
          subtitle="Enter your email to reveal the color your chart radiates."
        />
      )}

      {/* Share modal */}
      {shareOpen && (
        <EnergyColorShareModal
          colorHex={result.color}
          colorName={result.name}
          desc={result.desc}
          userEmail={userEmail}
          resultUrl={resultUrl}
          shareText={shareText}
          onClose={() => setShareOpen(false)}
        />
      )}

      <div className={`max-w-sm mx-auto space-y-8 transition-all duration-500 ${!unlocked ? "blur-sm pointer-events-none select-none" : ""}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <a href="/energy-color" className="text-muted hover:text-text transition-colors text-sm">← Back</a>
          <div className="flex flex-col items-center leading-none gap-0">
            <span className="text-sm font-bold gradient-text">US</span>
            <span className="text-xs font-bold gradient-text">NE</span>
          </div>
        </div>

        {/* Result card */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Color circle */}
          <div
            className="w-32 h-32 rounded-full shadow-2xl"
            style={{
              background: result.color,
              boxShadow: `0 0 60px ${result.color}55, 0 0 120px ${result.color}22`,
            }}
          />

          <span className="text-xs uppercase tracking-widest text-muted/60">Your energy color</span>
          <h1 className="text-4xl font-display font-black text-white leading-tight" style={{ textShadow: `0 0 40px ${result.color}88` }}>
            {result.name}
          </h1>

          {/* Divider */}
          <div className="w-12 h-px bg-white/20 my-1" />

          {/* Description */}
          <p className="text-sm text-text/85 leading-relaxed font-display italic max-w-xs">
            &ldquo;{result.desc}&rdquo;
          </p>
        </div>

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          className="w-full py-4 rounded-xl font-semibold text-sm tracking-wide
            bg-gradient-to-r from-accent to-accent-2 text-white
            hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Share My Color
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg px-4 text-xs text-muted/60 uppercase tracking-widest">Go deeper</span>
          </div>
        </div>

        {/* $1 upsell */}
        <a
          href={`/paid/fiveElements?${new URLSearchParams(spParams).toString()}`}
          className="block rounded-xl border border-accent/20 bg-[#12121a]/60 p-5 hover:border-accent/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text/90">See your full chart →</p>
              <p className="text-xs text-muted/60 leading-snug">Understand every layer of your energy — what you lead with, what you suppress, and what you need more of.</p>
            </div>
            <span className="text-base font-bold gradient-text whitespace-nowrap">$1</span>
          </div>
        </a>

        <div className="h-8" />
      </div>
    </main>
  );
}

export default function EnergyColorResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted text-sm animate-pulse">Reading your frequency…</div>
        </div>
      }
    >
      <EnergyColorResultContent />
    </Suspense>
  );
}
