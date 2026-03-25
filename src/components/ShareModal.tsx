"use client";

import { useRef, useState } from "react";
import { IdolMatch } from "@/lib/idols";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ShareModalProps {
  name: string;
  match: IdolMatch;
  userEmail: string;
  resultUrl: string;
  shareText: string;
  onClose: () => void;
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

// Inline score ring — no animation so html2canvas captures it correctly
function ScoreRingCard({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: 88, height: 88, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="ring-grad-card" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e1e2e" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="url(#ring-grad-card)"
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1, background: "linear-gradient(135deg,#c084fc,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {score}%
        </span>
        <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
          match
        </span>
      </div>
    </div>
  );
}

async function captureCard(el: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(el, { scale: 2, backgroundColor: "#0a0a0f", useCORS: true, logging: false });
}

export default function ShareModal({
  name,
  match,
  userEmail,
  resultUrl,
  shareText,
  onClose,
}: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponShown, setCouponShown] = useState(false);
  const [couponCopied, setCouponCopied] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // Only Instagram, TikTok, X trigger the coupon
  async function triggerCoupon() {
    if (couponShown) return;
    const code = generateCouponCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setCouponCode(code);
    setCouponShown(true);
    try {
      await addDoc(collection(db, "coupons"), {
        email: userEmail,
        code,
        createdAt: serverTimestamp(),
        expiresAt,
        used: false,
      });
    } catch { /* don't block */ }
    try {
      fetch("/api/send-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code, expiresAt: expiresAt.toISOString() }),
      });
    } catch { /* don't block */ }
  }

  // Save as Photo — no coupon
  async function handleSavePhoto() {
    const el = cardRef.current;
    if (!el) return;
    const canvas = await captureCard(el);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
    a.click();
    showToast("Photo saved!");
  }

  // Instagram — triggers coupon
  async function handleInstagram() {
    const el = cardRef.current;
    if (!el) return;
    const canvas = await captureCard(el);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Image copied — open Instagram and paste!");
      } catch {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
        a.click();
        showToast("Image saved — share it on Instagram!");
      }
    }, "image/png");
    await triggerCoupon();
  }

  // TikTok — triggers coupon
  async function handleTikTok() {
    const el = cardRef.current;
    if (!el) return;
    const canvas = await captureCard(el);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Image copied — open TikTok and paste!");
      } catch {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `usunse-${match.idol.name.replace(/\s/g, "-")}.png`;
        a.click();
        showToast("Image saved — share it on TikTok!");
      }
    }, "image/png");
    await triggerCoupon();
  }

  // Copy Link — no coupon
  async function handleCopyLink() {
    await navigator.clipboard.writeText(resultUrl);
    showToast("Link copied!");
  }

  // X/Twitter — triggers coupon
  function handleTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    triggerCoupon();
  }

  async function copyCoupon() {
    await navigator.clipboard.writeText(couponCode);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  }

  const gradientStyle = {
    background: "linear-gradient(135deg,#c084fc,#f472b6)",
    WebkitBackgroundClip: "text" as const,
    WebkitTextFillColor: "transparent" as const,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-y-auto max-h-[95vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-muted hover:text-text transition-colors text-sm"
        >
          ×
        </button>

        {/* 9:16 share card */}
        <div
          ref={cardRef}
          style={{
            width: "100%",
            aspectRatio: "9/16",
            background: "linear-gradient(160deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glows */}
          <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "30%", background: "rgba(192,132,252,0.15)", borderRadius: "50%", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "12%", right: "15%", width: "45%", height: "20%", background: "rgba(244,114,182,0.1)", borderRadius: "50%", filter: "blur(30px)" }} />

          {/* Content — safe zone 15% top+bottom for 4:5 crop safety */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "15% 8%" }}>

            {/* Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 900, ...gradientStyle }}>US</span>
              <span style={{ fontSize: 12, fontWeight: 900, ...gradientStyle }}>NE</span>
            </div>

            {/* Center block */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
              {/* Subtle label */}
              <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                {name.toUpperCase()}&apos;S DESTINY MATCH
              </p>

              {/* Name + connector + idol — vertical stack */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.02em" }}>
                  {name}
                </span>
                <span style={{ fontSize: 13, color: "rgba(192,132,252,0.7)", lineHeight: 1 }}>✦</span>
                <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.05, ...gradientStyle }}>
                  {match.idol.name}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  {match.idol.group}
                </span>
              </div>

              {/* Score ring */}
              <div style={{ marginTop: 6 }}>
                <ScoreRingCard score={match.score} />
              </div>

              {/* Short description */}
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", maxWidth: "80%", lineHeight: 1.55 }}>
                {getShortDesc(match.score)}
              </p>
            </div>

            {/* Bottom URL */}
            <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              usunse.com
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 p-4">
          <button
            onClick={handleSavePhoto}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Save as Photo
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleInstagram} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 transition-colors">
              Share to Instagram
            </button>
            <button onClick={handleTikTok} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-text/80 hover:border-accent/30 transition-colors">
              Share to TikTok
            </button>
            <button onClick={handleCopyLink} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">
              Copy Link
            </button>
            <button onClick={handleTwitter} className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-muted hover:border-accent/30 hover:text-text transition-colors">
              Share on 𝕏
            </button>
          </div>

          {/* Coupon — only after Instagram / TikTok / X */}
          {couponShown && (
            <div className="mt-1 rounded-xl border border-accent/30 bg-accent/5 p-4 flex flex-col items-center gap-2 text-center">
              <p className="text-[10px] text-muted/70 uppercase tracking-widest">Your 30% off code</p>
              <span className="text-xl font-black tracking-[0.15em] gradient-text">{couponCode}</span>
              <p className="text-[10px] text-muted/50">Valid for any $10 reading · 7 days</p>
              <button
                onClick={copyCoupon}
                className="px-4 py-1.5 rounded-lg border border-accent/30 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                {couponCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e2e] border border-white/10 text-sm text-text px-4 py-2 rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
