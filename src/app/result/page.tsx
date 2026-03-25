"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getIdolMatch, IdolMatch } from "@/lib/idols";
import ScoreRing from "@/components/ScoreRing";
import FourPillarsDisplay from "@/components/FourPillarsDisplay";
import EmailGate from "@/components/EmailGate";
import TierCards from "@/components/TierCards";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

function getShortDesc(score: number): string {
  if (score >= 85) return "A rare celestial alignment — once in a generation.";
  if (score >= 75) return "Harmony and magnetic pull — written in the stars.";
  if (score >= 65) return "A genuine cosmic thread — your charts agree.";
  return "Contrast that sparks growth — an invitation, not a warning.";
}

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "USNE-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 16:9 shareable card component
function ShareCard({
  name,
  match,
}: {
  name: string;
  match: IdolMatch;
}) {
  return (
    <div className="w-full aspect-video rounded-2xl relative overflow-hidden border border-white/10"
      style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)" }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-[60px]"
        style={{ background: "rgba(192,132,252,0.2)" }} />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full blur-[50px]"
        style={{ background: "rgba(244,114,182,0.1)" }} />

      {/* Content — safe zone inset */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-5 px-8">
        {/* Logo */}
        <div className="flex flex-col items-center leading-none gap-0">
          <span className="text-[11px] font-bold tracking-tight gradient-text">US</span>
          <span className="text-[11px] font-bold tracking-tight gradient-text">NE</span>
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{name}&apos;s destiny</p>
          <h2 className="text-xl font-bold gradient-text leading-tight">{match.idol.name}</h2>
          <p className="text-[11px] text-white/40">{match.idol.group}</p>
          <div className="mt-1">
            <span className="text-4xl font-black gradient-text tabular-nums">{match.score}%</span>
          </div>
          <p className="text-[10px] text-white/50 max-w-[55%] leading-snug mt-0.5">
            {getShortDesc(match.score)}
          </p>
        </div>

        {/* Bottom URL */}
        <p className="text-[9px] tracking-widest uppercase text-white/25">usunse.com</p>
      </div>
    </div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "You";
  const dob = searchParams.get("dob") || "";
  const hourStr = searchParams.get("hour");

  const [unlocked, setUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [match, setMatch] = useState<IdolMatch | null>(null);
  const [shareText, setShareText] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponShown, setCouponShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const couponRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dob) return;
    const [y, m, d] = dob.split("-").map(Number);
    const hour = hourStr !== null ? parseInt(hourStr) : undefined;
    const result = getIdolMatch(y, m, d, hour);
    setMatch(result);
    setShareText(
      `My K-pop destiny match is ${result.idol.name} (${result.idol.group}) — ${result.score}% compatibility! Find yours at usunse.com`
    );
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
  const resultUrl = typeof window !== "undefined"
    ? `${window.location.origin}/result?${new URLSearchParams(spParams).toString()}`
    : "";

  async function handleShare(type: "twitter" | "instagram" | "link") {
    // Execute share action
    if (type === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else {
      await navigator.clipboard.writeText(resultUrl || shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    // Generate coupon only once
    if (couponShown) return;
    const code = generateCouponCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    setCouponCode(code);
    setCouponShown(true);

    // Save to Firebase
    try {
      await addDoc(collection(db, "coupons"), {
        email: userEmail,
        code,
        createdAt: serverTimestamp(),
        expiresAt,
        used: false,
      });
    } catch { /* don't block */ }

    // Send email
    try {
      await fetch("/api/send-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code, expiresAt: expiresAt.toISOString() }),
      });
    } catch { /* don't block */ }

    // Scroll to coupon
    setTimeout(() => couponRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }

  async function copyCoupon() {
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen px-4 py-10 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Email gate overlay */}
      {!unlocked && (
        <EmailGate
          onUnlock={(email) => { setUnlocked(true); setUserEmail(email); }}
          idolName={match.idol.name}
        />
      )}

      <div className={`max-w-sm mx-auto space-y-8 transition-all duration-500 ${!unlocked ? "blur-sm pointer-events-none select-none" : ""}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <a href="/" className="text-muted hover:text-text transition-colors text-sm">← Back</a>
          <div className="flex flex-col items-center leading-none gap-0">
            <span className="text-sm font-bold gradient-text">US</span>
            <span className="text-xs font-bold gradient-text">NE</span>
          </div>
        </div>

        {/* Match reveal */}
        <div className="text-center space-y-1">
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

        {/* Description */}
        <p className="text-sm text-text/90 leading-relaxed text-center font-display italic">
          &ldquo;{description}&rdquo;
        </p>

        {/* Four Pillars */}
        <FourPillarsDisplay pillars={match.userPillars} label="Your Four Pillars" />

        {/* Shareable card */}
        <ShareCard name={name} match={match} />

        {/* Share buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleShare("twitter")}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-text text-center hover:border-accent transition-colors"
          >
            𝕏 Share
          </button>
          <button
            onClick={() => handleShare("instagram")}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted text-center hover:border-accent hover:text-text transition-colors"
          >
            {copied ? "Copied!" : "Copy for IG"}
          </button>
          <button
            onClick={() => handleShare("link")}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted text-center hover:border-accent hover:text-text transition-colors"
          >
            Copy link
          </button>
        </div>

        {/* Coupon — only after share */}
        {couponShown && (
          <div ref={couponRef} className="rounded-xl border border-accent/30 bg-accent/5 p-5 flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-muted/70 uppercase tracking-widest">Your 30% off code</p>
            <span className="text-2xl font-black tracking-[0.15em] gradient-text">{couponCode}</span>
            <p className="text-xs text-muted/50">Valid for any $10 reading · expires in 7 days</p>
            <button
              onClick={copyCoupon}
              className="px-5 py-2 rounded-lg border border-accent/30 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        )}

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
