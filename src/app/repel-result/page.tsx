"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getRepelResult, getRepelCopy, getRepelHook, RepelResult } from "@/lib/repel";
import EmailGate from "@/components/EmailGate";
import RepelShareModal from "@/components/RepelShareModal";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

function safeDocId(email: string, dob: string, test: string): string {
  return `${email.replace(/[^a-zA-Z0-9]/g, "_")}_${dob}_${test}`;
}

function RepelResultContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "You";
  const dob = searchParams.get("dob") || "";

  const [unlocked, setUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [result, setResult] = useState<RepelResult | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!dob) return;
    const [y, m, d] = dob.split("-").map(Number);
    setResult(getRepelResult(y, m, d));
  }, [dob]);

  async function handleUnlock(email: string) {
    setUserEmail(email);
    try {
      const docRef = doc(db, "completions", safeDocId(email, dob, "repel-test"));
      const snap = await getDoc(docRef);
      if (!snap.exists() && result) {
        await setDoc(docRef, {
          email, dob, test: "repel-test",
          result: result.repelType.name,
          createdAt: serverTimestamp(),
        });
      }
    } catch { /* don't block */ }
    setUnlocked(true);
    window.scrollTo(0, 0);
  }

  if (!dob || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm">
          <a href="/repel-test" className="hover:text-accent transition-colors">← Start over</a>
        </div>
      </div>
    );
  }

  const copy = getRepelCopy(result.key);
  const hook = getRepelHook(result.key);
  const resultUrl = typeof window !== "undefined"
    ? `${window.location.origin}/repel-result?${new URLSearchParams({ name, dob }).toString()}`
    : "";
  const shareText = `${hook}\n'${result.repelType.tagline}'\nusunse.com/repel-test`;
  const spParams = { name, dob };

  return (
    <main className="min-h-screen px-4 py-10 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Email gate */}
      {!unlocked && (
        <EmailGate
          onUnlock={handleUnlock}
          idolName={result.repelType.name}
          name={name}
          dob={dob}
          title="Your pattern is ready"
          subtitle="Enter your email to reveal the type you keep attracting — and why."
        />
      )}

      {/* Share modal */}
      {shareOpen && (
        <RepelShareModal
          hookLine={hook}
          tagline={result.repelType.tagline}
          userEmail={userEmail}
          resultUrl={resultUrl}
          shareText={shareText}
          onClose={() => setShareOpen(false)}
        />
      )}

      <div className={`max-w-sm mx-auto space-y-8 transition-all duration-500 ${!unlocked ? "blur-sm pointer-events-none select-none" : ""}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <a href="/repel-test" className="text-muted hover:text-text transition-colors text-sm">← Back</a>
          <div className="flex flex-col items-center leading-none gap-0">
            <span className="text-sm font-bold gradient-text">US</span>
            <span className="text-xs font-bold gradient-text">NE</span>
          </div>
        </div>

        {/* Result card */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Hook line */}
          <p className="text-lg font-display font-semibold text-text/90 leading-snug italic">
            &ldquo;{hook}&rdquo;
          </p>

          {/* Divider */}
          <div className="w-12 h-px bg-accent/30 my-1" />

          {/* Body copy */}
          <p className="text-sm text-text/75 leading-relaxed">
            {copy}
          </p>

          {/* Tagline */}
          <p className="text-sm italic text-muted/60 mt-1">{result.repelType.tagline}</p>
        </div>

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          className="w-full py-4 rounded-xl font-semibold text-sm tracking-wide
            bg-gradient-to-r from-accent to-accent-2 text-white
            hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Share My Result
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg px-4 text-xs text-muted/60 uppercase tracking-widest">
              Go deeper
            </span>
          </div>
        </div>

        {/* $1 compatibility upsell */}
        <a
          href={`/paid/compatibility?${new URLSearchParams(spParams).toString()}`}
          className="block rounded-xl border border-accent/20 bg-[#12121a]/60 p-5 hover:border-accent/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text/90">Understand this pattern →</p>
              <p className="text-xs text-muted/60 leading-snug">Check your compatibility with anyone — a crush, a rival, a partner. See exactly where the tension lives.</p>
            </div>
            <span className="text-base font-bold gradient-text whitespace-nowrap">$1</span>
          </div>
        </a>

        <div className="h-8" />
      </div>
    </main>
  );
}

export default function RepelResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted text-sm animate-pulse">Reading your pattern…</div>
        </div>
      }
    >
      <RepelResultContent />
    </Suspense>
  );
}
